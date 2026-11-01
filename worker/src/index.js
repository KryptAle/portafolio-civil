/**
 * API del panel de administración.
 *
 * Secretos (Cloudflare → Settings → Variables and Secrets):
 *   ADMIN_PASSWORD   contraseña del panel (nunca se guarda en el repo)
 *   SESSION_SECRET   cadena aleatoria larga para firmar sesiones
 *   GITHUB_TOKEN     token fine-grained con Contents: Read and write
 *   GITHUB_REPO      usuario/repositorio, por ejemplo KryptAle/portafolio-civil
 *   GITHUB_BRANCH    rama, por ejemplo main
 *   ALLOWED_ORIGIN   https://kryptale.github.io
 */

const RUTA_CONTENIDO = 'src/data/sitio.json';
const MAX_SUBIDA = 9 * 1024 * 1024;
const DURACION_SESION = 12 * 60 * 60;

const codificador = new TextEncoder();

const aBase64Url = (bytes) => {
  let binario = '';
  for (const byte of new Uint8Array(bytes)) binario += String.fromCharCode(byte);
  return btoa(binario).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const desdeBase64Url = (texto) => {
  const normal = texto.replace(/-/g, '+').replace(/_/g, '/');
  const relleno = normal + '='.repeat((4 - (normal.length % 4)) % 4);
  const binario = atob(relleno);
  return Uint8Array.from(binario, (caracter) => caracter.charCodeAt(0));
};

const aBase64 = (bytes) => {
  let binario = '';
  for (const byte of new Uint8Array(bytes)) binario += String.fromCharCode(byte);
  return btoa(binario);
};

const desdeBase64 = (texto) => {
  const binario = atob(texto);
  return Uint8Array.from(binario, (caracter) => caracter.charCodeAt(0));
};

const json = (datos, estado = 200, extra = {}) =>
  new Response(JSON.stringify(datos), {
    status: estado,
    headers: { 'content-type': 'application/json; charset=utf-8', ...extra },
  });

const cors = (request, env) => {
  const origen = request.headers.get('Origin') ?? '';
  const permitidos = (env.ALLOWED_ORIGIN ?? '').split(',').map((valor) => valor.trim());
  const permitido = permitidos.includes(origen) ? origen : permitidos[0] ?? '';
  return {
    'Access-Control-Allow-Origin': permitido,
    'Access-Control-Allow-Headers': 'authorization, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
};

const firmar = async (datos, secreto) => {
  const cuerpo = aBase64Url(codificador.encode(datos));
  const clave = await crypto.subtle.importKey(
    'raw',
    codificador.encode(secreto),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const firma = await crypto.subtle.sign('HMAC', clave, codificador.encode(cuerpo));
  return `${cuerpo}.${aBase64Url(firma)}`;
};

const verificar = async (token, secreto) => {
  if (!token || !token.includes('.')) return null;
  const [datos, firma] = token.split('.');
  const clave = await crypto.subtle.importKey(
    'raw',
    codificador.encode(secreto),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify'],
  );
  const valida = await crypto.subtle.verify(
    'HMAC',
    clave,
    desdeBase64Url(firma),
    codificador.encode(datos),
  );
  if (!valida) return null;
  try {
    const payload = JSON.parse(new TextDecoder().decode(desdeBase64Url(datos)));
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
};

const autenticado = async (request, env) => {
  const cabecera = request.headers.get('Authorization') ?? '';
  const token = cabecera.startsWith('Bearer ') ? cabecera.slice(7) : '';
  return verificar(token, env.SESSION_SECRET);
};

const compararSeguro = (a, b) => {
  if (a.length !== b.length) return false;
  let diferencia = 0;
  for (let i = 0; i < a.length; i++) diferencia |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diferencia === 0;
};

const github = async (env, ruta, opciones = {}) => {
  const respuesta = await fetch(
    `https://api.github.com/repos/${env.GITHUB_REPO}/contents/${ruta}`,
    {
      ...opciones,
      headers: {
        Authorization: `Bearer ${env.GITHUB_TOKEN}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'portafolio-admin',
        'X-GitHub-Api-Version': '2022-11-28',
        ...(opciones.headers ?? {}),
      },
    },
  );
  if (!respuesta.ok) {
    const detalle = await respuesta.text();
    throw new Error(`GitHub ${respuesta.status}: ${detalle.slice(0, 300)}`);
  }
  return respuesta.json();
};

const leerContenido = async (env) => {
  const archivo = await github(env, `${RUTA_CONTENIDO}?ref=${env.GITHUB_BRANCH}`);
  const texto = new TextDecoder().decode(desdeBase64(archivo.content.replace(/\n/g, '')));
  return { contenido: JSON.parse(texto), sha: archivo.sha };
};

const guardarContenido = async (env, contenido, sha, mensaje) => {
  const texto = `${JSON.stringify(contenido, null, 2)}\n`;
  return github(env, RUTA_CONTENIDO, {
    method: 'PUT',
    body: JSON.stringify({
      message: mensaje || 'Actualizar contenido desde el panel',
      content: aBase64(codificador.encode(texto)),
      sha,
      branch: env.GITHUB_BRANCH,
    }),
  });
};

const subirArchivo = async (env, archivo, destino, mensaje) => {
  const bytes = new Uint8Array(await archivo.arrayBuffer());
  if (bytes.byteLength > MAX_SUBIDA) {
    throw new Error('El archivo supera el límite de 9 MB del Worker.');
  }
  let sha;
  try {
    const existente = await github(env, `${destino}?ref=${env.GITHUB_BRANCH}`);
    sha = existente.sha;
  } catch {
    sha = undefined;
  }
  await github(env, destino, {
    method: 'PUT',
    body: JSON.stringify({
      message: mensaje || `Subir ${destino}`,
      content: aBase64(bytes),
      ...(sha ? { sha } : {}),
      branch: env.GITHUB_BRANCH,
    }),
  });
  return { ruta: destino.replace(/^public\//, ''), bytes: bytes.byteLength };
};

export default {
  async fetch(request, env) {
    const cabeceras = cors(request, env);
    if (request.method === 'OPTIONS') return new Response(null, { headers: cabeceras });

    const url = new URL(request.url);
    try {
      if (url.pathname === '/health') {
        return json({ ok: true }, 200, cabeceras);
      }

      if (url.pathname === '/login' && request.method === 'POST') {
        const { password } = await request.json();
        if (!password || !compararSeguro(String(password), String(env.ADMIN_PASSWORD ?? ''))) {
          return json({ error: 'Contraseña incorrecta' }, 401, cabeceras);
        }
        const ahora = Math.floor(Date.now() / 1000);
        const token = await firmar(
          JSON.stringify({ sub: 'admin', iat: ahora, exp: ahora + DURACION_SESION }),
          env.SESSION_SECRET,
        );
        return json({ token, expira: ahora + DURACION_SESION }, 200, cabeceras);
      }

      const sesion = await autenticado(request, env);
      if (!sesion) return json({ error: 'Sesión no válida' }, 401, cabeceras);

      if (url.pathname === '/content' && request.method === 'GET') {
        const { contenido, sha } = await leerContenido(env);
        return json({ contenido, sha }, 200, cabeceras);
      }

      if (url.pathname === '/content' && request.method === 'PUT') {
        const cuerpo = await request.json();
        if (!cuerpo || typeof cuerpo.contenido !== 'object' || Array.isArray(cuerpo.contenido)) {
          return json({ error: 'Contenido inválido' }, 400, cabeceras);
        }
        if (!cuerpo.contenido.sitio || !Array.isArray(cuerpo.contenido.secciones)) {
          return json({ error: 'Faltan sitio o secciones' }, 400, cabeceras);
        }
        const resultado = await guardarContenido(
          env,
          cuerpo.contenido,
          cuerpo.sha,
          cuerpo.mensaje,
        );
        return json({ ok: true, commit: resultado.commit?.sha }, 200, cabeceras);
      }

      if (url.pathname === '/upload' && request.method === 'POST') {
        const formulario = await request.formData();
        const archivo = formulario.get('file');
        const destino = String(formulario.get('destino') ?? '');
        if (!archivo || typeof archivo === 'string' || typeof archivo.arrayBuffer !== 'function') {
          return json({ error: 'Falta el archivo' }, 400, cabeceras);
        }
        if (!/^public\/(uploads|modelos)\/[a-z0-9._/-]+$/i.test(destino) || destino.includes('..')) {
          return json({ error: 'Destino no permitido' }, 400, cabeceras);
        }
        const resultado = await subirArchivo(env, archivo, destino, formulario.get('mensaje'));
        return json({ ok: true, ...resultado }, 200, cabeceras);
      }

      return json({ error: 'Ruta no encontrada' }, 404, cabeceras);
    } catch (error) {
      return json({ error: error.message ?? 'Error interno' }, 500, cabeceras);
    }
  },
};
