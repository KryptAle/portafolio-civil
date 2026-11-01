/**
 * Visor IFC mínimo: three.js + web-ifc.
 * Solo lectura: orbitar, hacer zoom, encuadrar y cambiar de modelo.
 */

export type EstadoCarga = (texto: string) => void;

export interface OpcionesVisor {
  contenedor: HTMLElement;
  archivo: string;
  base: string;
  onEstado?: EstadoCarga;
}

export interface Visor {
  reencuadrar: () => void;
  cambiar: (archivo: string) => Promise<void>;
  destruir: () => void;
}

export async function iniciarVisor({
  contenedor,
  archivo,
  base,
  onEstado,
}: OpcionesVisor): Promise<Visor> {
  const avisar = (texto: string) => onEstado?.(texto);

  avisar('Cargando visor…');
  const THREE = await import('three');
  const { OrbitControls } = await import('three/addons/controls/OrbitControls.js');
  const { mergeGeometries } = await import('three/addons/utils/BufferGeometryUtils.js');
  const webIfc = await import('web-ifc');
  const { IfcAPI } = webIfc;

  const ancho = contenedor.clientWidth || 960;
  const alto = contenedor.clientHeight || 540;

  const escena = new THREE.Scene();
  escena.background = new THREE.Color(0x10151a);

  const camara = new THREE.PerspectiveCamera(50, ancho / alto, 0.1, 5000);
  camara.up.set(0, 0, 1);

  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setSize(ancho, alto);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.addEventListener('contextmenu', (evento) => evento.preventDefault());
  renderer.domElement.style.userSelect = 'none';
  contenedor.appendChild(renderer.domElement);

  const controles = new OrbitControls(camara, renderer.domElement);
  controles.enableDamping = true;
  controles.dampingFactor = 0.08;
  controles.screenSpacePanning = true;

  escena.add(new THREE.HemisphereLight(0xffffff, 0x334455, 2.2));
  const luz = new THREE.DirectionalLight(0xffffff, 2.4);
  luz.position.set(6, 8, 12);
  escena.add(luz);
  const luz2 = new THREE.DirectionalLight(0xffffff, 0.7);
  luz2.position.set(-8, -6, 6);
  escena.add(luz2);

  const api = new IfcAPI();
  const baseLimpia = base.endsWith('/') ? base : `${base}/`;
  api.SetWasmPath(baseLimpia, true);
  await api.Init();

  let modeloID = -1;
  let grupo: InstanceType<typeof THREE.Group> | null = null;
  let rejilla: InstanceType<typeof THREE.GridHelper> | null = null;
  let tamano = new THREE.Vector3(1, 1, 1);
  let escala = 1;

  /* Materiales planos y compartidos: más baratos que PBR, sobre todo en Firefox. */
  const materiales = new Map<string, InstanceType<typeof THREE.MeshLambertMaterial>>();
  const materialPara = (color: { x: number; y: number; z: number }) => {
    const clave = `${color.x.toFixed(3)},${color.y.toFixed(3)},${color.z.toFixed(3)}`;
    let material = materiales.get(clave);
    if (!material) {
      material = new THREE.MeshLambertMaterial({
        color: new THREE.Color(color.x, color.y, color.z),
      });
      materiales.set(clave, material);
    }
    return material;
  };

  const limpiar = () => {
    if (grupo) {
      grupo.traverse((objeto) => {
        const malla = objeto as InstanceType<typeof THREE.Mesh>;
        if (malla.isMesh) malla.geometry.dispose();
      });
      escena.remove(grupo);
      grupo = null;
    }
    for (const material of materiales.values()) material.dispose();
    materiales.clear();
    if (modeloID >= 0) {
      api.CloseModel(modeloID);
      modeloID = -1;
    }
  };

  const descargar = async (url: string) => {
    const respuesta = await fetch(url);
    if (!respuesta.ok) throw new Error(`No se pudo descargar el modelo (${respuesta.status})`);
    const total = Number(respuesta.headers.get('content-length') ?? 0);

    if (!respuesta.body || !total) {
      return new Uint8Array(await respuesta.arrayBuffer());
    }

    const lector = respuesta.body.getReader();
    const trozos: Uint8Array[] = [];
    let leido = 0;
    for (;;) {
      const { done, value } = await lector.read();
      if (done) break;
      trozos.push(value);
      leido += value.length;
      avisar(`Descargando modelo… ${Math.round((leido / total) * 100)} %`);
    }
    const datos = new Uint8Array(leido);
    let posicion = 0;
    for (const trozo of trozos) {
      datos.set(trozo, posicion);
      posicion += trozo.length;
    }
    return datos;
  };

  const cargar = async (nuevoArchivo: string) => {
    avisar('Descargando modelo…');
    const datos = await descargar(nuevoArchivo);

    avisar('Leyendo geometría…');
    limpiar();
    modeloID = api.OpenModel(datos);
    const nuevoGrupo = new THREE.Group();
    escena.add(nuevoGrupo);

    const malla = api.LoadAllGeometry(modeloID);
    const total = malla.size();
    const porMaterial = new Map<
      InstanceType<typeof THREE.MeshLambertMaterial>,
      InstanceType<typeof THREE.BufferGeometry>[]
    >();

    for (let i = 0; i < total; i++) {
      const plana = malla.get(i);
      const geometrias = plana.geometries;
      for (let g = 0; g < geometrias.size(); g++) {
        const colocada = geometrias.get(g);
        const geometria = api.GetGeometry(modeloID, colocada.geometryExpressID);
        const vertices = api.GetVertexArray(
          geometria.GetVertexData(),
          geometria.GetVertexDataSize(),
        );
        const indices = api.GetIndexArray(geometria.GetIndexData(), geometria.GetIndexDataSize());
        const cuentas = vertices.length / 6;
        if (!cuentas) continue;

        const posiciones = new Float32Array(cuentas * 3);
        const normales = new Float32Array(cuentas * 3);
        for (let v = 0, p = 0; v < vertices.length; v += 6, p += 3) {
          posiciones[p] = vertices[v];
          posiciones[p + 1] = vertices[v + 1];
          posiciones[p + 2] = vertices[v + 2];
          normales[p] = vertices[v + 3];
          normales[p + 1] = vertices[v + 4];
          normales[p + 2] = vertices[v + 5];
        }

        const bufferGeom = new THREE.BufferGeometry();
        bufferGeom.setAttribute('position', new THREE.BufferAttribute(posiciones, 3));
        bufferGeom.setAttribute('normal', new THREE.BufferAttribute(normales, 3));
        if (indices.length > 0) {
          bufferGeom.setIndex(new THREE.BufferAttribute(indices, 1));
        } else {
          const secuencia = new Uint32Array(cuentas);
          for (let k = 0; k < cuentas; k++) secuencia[k] = k;
          bufferGeom.setIndex(new THREE.BufferAttribute(secuencia, 1));
        }
        bufferGeom.applyMatrix4(new THREE.Matrix4().fromArray(colocada.flatTransformation));

        const material = materialPara(colocada.color);
        const lista = porMaterial.get(material);
        if (lista) lista.push(bufferGeom);
        else porMaterial.set(material, [bufferGeom]);
      }
    }

    /* Una sola malla por material: de cientos de draw calls a unas pocas. */
    for (const [material, geometrias] of porMaterial) {
      if (geometrias.length === 1) {
        nuevoGrupo.add(new THREE.Mesh(geometrias[0], material));
        continue;
      }
      const fusionada = mergeGeometries(geometrias, false);
      if (!fusionada) {
        for (const geometria of geometrias) nuevoGrupo.add(new THREE.Mesh(geometria, material));
        continue;
      }
      for (const geometria of geometrias) geometria.dispose();
      nuevoGrupo.add(new THREE.Mesh(fusionada, material));
    }

    nuevoGrupo.updateMatrixWorld(true);
    const cajaInicial = new THREE.Box3().setFromObject(nuevoGrupo);
    const tamanoInicial = cajaInicial.getSize(new THREE.Vector3());

    /* El IFC puede venir con la altura en X o Y según cómo se exportó.
       Se compara la extensión de cada eje con el rango de niveles para
       elegir el eje vertical y girar el modelo a Z-arriba. */
    const rangoNiveles = (() => {
      try {
        const ids = api.GetLineIDsWithType(modeloID, webIfc.IFCBUILDINGSTOREY);
        const valores: number[] = [];
        for (let i = 0; i < ids.size(); i++) {
          const nivel = api.GetLine(modeloID, ids.get(i)) as {
            Elevation?: number | { value?: number; _representationValue?: number };
          };
          const elevacion = nivel?.Elevation;
          const valor =
            typeof elevacion === 'number'
              ? elevacion
              : (elevacion?.value ?? elevacion?._representationValue);
          const numero = Number(valor);
          if (Number.isFinite(numero)) valores.push(numero);
        }
        if (valores.length < 2) return null;
        return Math.max(...valores) - Math.min(...valores);
      } catch {
        return null;
      }
    })();

    let ejeArriba: 'x' | 'y' | 'z' = 'z';
    if (rangoNiveles && rangoNiveles > 1) {
      const ratios = {
        x: tamanoInicial.x / rangoNiveles,
        y: tamanoInicial.y / rangoNiveles,
        z: tamanoInicial.z / rangoNiveles,
      };
      let mejor = Infinity;
      (['x', 'y', 'z'] as const).forEach((eje) => {
        const distancia = Math.abs(ratios[eje] - 1.08);
        if (distancia < mejor) {
          mejor = distancia;
          ejeArriba = eje;
        }
      });
    }

    if (ejeArriba === 'y') nuevoGrupo.rotation.x = Math.PI / 2;
    if (ejeArriba === 'x') nuevoGrupo.rotation.y = -Math.PI / 2;
    nuevoGrupo.updateMatrixWorld(true);

    const caja = new THREE.Box3().setFromObject(nuevoGrupo);
    const centro = caja.getCenter(new THREE.Vector3());
    tamano = caja.getSize(new THREE.Vector3());
    const mayor = Math.max(tamano.x, tamano.y, tamano.z) || 1;
    escala = 10 / mayor;
    nuevoGrupo.scale.setScalar(escala);
    nuevoGrupo.position.copy(centro).multiplyScalar(-escala);

    if (!rejilla) {
      rejilla = new THREE.GridHelper(24, 24, 0x2a3a44, 0x1a252d);
      rejilla.rotation.x = Math.PI / 2;
      escena.add(rejilla);
    }
    rejilla.position.z = (-tamano.z / 2) * escala;

    grupo = nuevoGrupo;
    encuadrar();
    sucio = true;
    despertar();
    avisar('');
  };

  const encuadrar = () => {
    const fov = (camara.fov * Math.PI) / 180;
    const tanV = Math.tan(fov / 2);
    const tanH = tanV * Math.max(camara.aspect, 1);

    const direccion = new THREE.Vector3(0.57, -0.71, 0.43).normalize();
    const adelante = direccion.clone().negate();
    const derecha = new THREE.Vector3()
      .crossVectors(adelante, new THREE.Vector3(0, 0, 1))
      .normalize();
    const arriba = new THREE.Vector3().crossVectors(derecha, adelante).normalize();

    const mitad = new THREE.Vector3(
      (tamano.x * escala) / 2,
      (tamano.y * escala) / 2,
      (tamano.z * escala) / 2,
    );

    let distancia = 0;
    for (const sx of [-1, 1]) {
      for (const sy of [-1, 1]) {
        for (const sz of [-1, 1]) {
          const punto = new THREE.Vector3(sx * mitad.x, sy * mitad.y, sz * mitad.z);
          const fondo = punto.dot(adelante);
          distancia = Math.max(
            distancia,
            fondo + Math.abs(punto.dot(derecha)) / tanH,
            fondo + Math.abs(punto.dot(arriba)) / tanV,
          );
        }
      }
    }
    distancia *= 1.08;

    controles.target.set(0, 0, 0);
    camara.position.copy(direccion.multiplyScalar(distancia));
    camara.near = 0.1;
    camara.far = 200;
    camara.updateProjectionMatrix();
    controles.minDistance = 2;
    controles.maxDistance = distancia * 4;
    controles.update();
  };

  let sucio = true;
  let animando = false;
  let visible = true;

  function dibujar() {
    const movido = controles.update();
    if (movido || sucio) {
      renderer.render(escena, camara);
      sucio = false;
    }
    if (!movido && !sucio) {
      animando = false;
      renderer.setAnimationLoop(null);
    }
  }

  function despertar() {
    if (!visible) return;
    sucio = true;
    if (animando) return;
    animando = true;
    renderer.setAnimationLoop(dibujar);
  }

  controles.addEventListener('start', despertar);
  controles.addEventListener('change', despertar);
  renderer.domElement.addEventListener('wheel', despertar, { passive: true });

  const observadorVisibilidad = new IntersectionObserver(
    (entradas) => {
      visible = entradas[0]?.isIntersecting ?? true;
      if (visible) {
        despertar();
      } else {
        animando = false;
        renderer.setAnimationLoop(null);
      }
    },
    { rootMargin: '160px' },
  );
  observadorVisibilidad.observe(contenedor);

  const alCambiarVisibilidad = () => {
    if (document.hidden) {
      animando = false;
      renderer.setAnimationLoop(null);
    } else {
      despertar();
    }
  };
  document.addEventListener('visibilitychange', alCambiarVisibilidad);

  const redimensionar = () => {
    const w = contenedor.clientWidth;
    const h = contenedor.clientHeight;
    if (!w || !h) return;
    camara.aspect = w / h;
    camara.updateProjectionMatrix();
    renderer.setSize(w, h);
    sucio = true;
    despertar();
  };
  const observador = new ResizeObserver(redimensionar);
  observador.observe(contenedor);

  await cargar(archivo);

  return {
    reencuadrar: () => {
      encuadrar();
      sucio = true;
      despertar();
    },
    cambiar: cargar,
    destruir: () => {
      renderer.setAnimationLoop(null);
      observador.disconnect();
      observadorVisibilidad.disconnect();
      document.removeEventListener('visibilitychange', alCambiarVisibilidad);
      limpiar();
      renderer.dispose();
      contenedor.removeChild(renderer.domElement);
    },
  };
}
