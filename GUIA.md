# Guía de edición y despliegue

Esta guía explica cómo mantener el portafolio sin depender de la memoria: qué archivo tocar, cómo probar los cambios, cómo publicarlos y cómo recuperar el proyecto en otro equipo (Windows o Linux).

> **Regla de oro:** el contenido normal se cambia desde el panel `/admin/`. El código, el CSS y los ajustes finos se cambian en el repositorio con VSCode/VSCodium. Si editas a mano algo que también edita el panel, el último cambio que se publique gana.

---

## 1. Direcciones del proyecto

| Qué | Dónde |
|---|---|
| Web publicada | https://kryptale.github.io/portafolio-civil/ |
| Panel de administración | https://kryptale.github.io/portafolio-civil/admin/ |
| API del panel (Worker) | https://portafolio-admin.ale-aguilera-ve.workers.dev |
| Repositorio | https://github.com/KryptAle/portafolio-civil |
| Rama de publicación | `main` |

El sitio es **estático**: Astro genera HTML/CSS/JS en `dist/` y GitHub Pages lo sirve. No hay servidor propio para la web; el único backend es el Worker del panel.

---

## 2. Mapa rápido del proyecto

```text
portafolio-civil/
├─ src/
│  ├─ data/sitio.json          ← TODO el contenido editable
│  ├─ lib/contenido.ts         ← lee el JSON y resuelve referencias/tokens
│  ├─ config.ts                ← base del sitio y helper ruta()
│  ├─ pages/index.astro        ← la página única (estructura de las secciones)
│  ├─ components/              ← Header, Footer, Hoja, Estructura (axonométrica), Visor3D
│  ├─ layouts/Base.astro       ← <head>, metadatos y scripts globales
│  ├─ lib/iso.ts               ← geometría SVG de la axonométrica
│  ├─ lib/visor3d.ts           ← visor IFC (three.js + web-ifc)
│  └─ styles/global.css        ← TODO el diseño visual
├─ public/
│  ├─ admin/index.html         ← panel de administración (se sirve tal cual)
│  ├─ modelos/                 ← archivos .ifc publicados
│  ├─ uploads/                 ← fotos e iconos subidos desde el panel
│  └─ web-ifc.wasm             ← motor del visor
├─ worker/                     ← API del panel para Cloudflare
├─ scripts/limpiar-dist.mjs    ← excluye el IFC viejo del despliegue
├─ .github/workflows/deploy.yml← build + publicación automática
├─ astro.config.mjs
├─ package.json
└─ GUIA.md                     ← este documento
```

---

## 3. Recuperar el proyecto en un equipo nuevo

### 3.1 Programas necesarios

**Windows**

1. **Git**: https://git-scm.com/download/win
2. **Node.js 24 LTS**: https://nodejs.org (incluye `npm` y `corepack`)
3. **pnpm 11**: se instala con Node. En PowerShell:
   ```powershell
   corepack enable
   corepack prepare pnpm@11 --activate
   pnpm -v
   ```
   Si `corepack` no existe o falla:
   ```powershell
   npm install -g pnpm@11
   ```
4. **VSCode** o **VSCodium**.
5. Opcional: **GitHub CLI** (`gh`) para autenticarte y ver despliegues.

**Linux (Debian/Ubuntu)**

```bash
sudo apt update
sudo apt install -y git curl
# Node 24 con nvm (recomendado)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
source ~/.bashrc
nvm install 24
nvm use 24
corepack enable
corepack prepare pnpm@11 --activate
```

En Fedora/Arch usa el gestor equivalente (`dnf`, `pacman`) o también `nvm`.

### 3.2 Clonar el repositorio

```bash
git clone https://github.com/KryptAle/portafolio-civil.git
cd portafolio-civil
pnpm install
```

En Windows, si Git te pide credenciales, usa tu cuenta de GitHub o un token personal. La forma más cómoda:

```bash
gh auth login
```

### 3.3 Arrancar en local

```bash
pnpm dev
```

Abre `http://localhost:4321/`. En desarrollo la base es `/`, no `/portafolio-civil/`.

Para probar exactamente como queda en GitHub Pages:

```powershell
# Windows PowerShell
$env:BASE_PATH = "/portafolio-civil"
pnpm build
pnpm preview
```

```bash
# Linux / macOS
BASE_PATH=/portafolio-civil pnpm build
pnpm preview
```

Abre `http://localhost:4321/portafolio-civil/`.

> `pnpm build` ejecuta además `scripts/limpiar-dist.mjs`, que elimina el IFC viejo de 44 MB de `dist/` si todavía existe en tu copia local.

---

## 4. Trabajar con DSH

1. Abre DSH y selecciona como workspace la carpeta `portafolio-civil`.
2. DSH usará el Node/pnpm del sistema. Si no los encuentra, instálalos como en el punto 3.1.
3. Pídele los cambios en lenguaje normal; DSH edita los archivos y ejecuta `pnpm build`.
4. Para publicar, DSH hace commit y push a `main`, o lo haces tú con Git.

DSH no necesita el Worker para editar el sitio. El Worker solo es necesario para el panel `/admin/`.

---

## 5. Trabajar con VSCode/VSCodium

### 5.1 Abrir

```bash
code .        # VSCode
codium .      # VSCodium
```

Extensiones recomendadas:

- **Astro** (sintaxis y autocompletado).
- **Prettier** (formato, opcional).
- **GitLens** (opcional, para ver historial).

### 5.2 Terminal integrada

`Ctrl + ñ` (Windows) o `` Ctrl + ` ``. Todos los comandos de esta guía se ejecutan ahí.

### 5.3 Flujo de trabajo

```bash
pnpm dev            # mientras editas
# ...cambias archivos y ves el resultado en el navegador...
pnpm build          # comprobar que compila
git status          # ver qué cambió
git add -A
git commit -m "Describe el cambio"
git push
```

El `push` a `main` dispara GitHub Actions. En ~40 segundos la web pública se actualiza.

---

## 6. Contenido: panel o archivo

### 6.1 Usa el panel para

- Textos de secciones, portada, perfil, servicios, contacto y footer.
- Añadir/quitar modelos, herramientas, cursos y cuadros.
- Cambiar la foto de perfil y los iconos.
- Subir IFC (hasta 12 MB).

Panel: https://kryptale.github.io/portafolio-civil/admin/

El panel tiene un menú lateral con **General**, **Contenido** y **Ayuda**. Cada sección de la página se edita por separado (Perfil, Qué hago, Modelos BIM, Herramientas, Trayectoria, Contacto). En **Valores globales** están los tokens `{{…}}`, su valor actual y de qué campo salen. Solo se muestran campos que existen en la landing.

### 6.2 Usa el archivo para

- Ajustes de diseño (CSS).
- Estructura HTML de una sección.
- Cambiar la lógica del visor o de la axonométrica.
- Añadir un tipo de sección nuevo.
- Corregir el JSON si el panel no está disponible.

Archivo de contenido: **`src/data/sitio.json`**.

---

## 7. Editar `src/data/sitio.json`

### 7.1 Estructura general

```json
{
  "sitio": { ... },
  "secciones": [ ... ],
  "nav": { "items": ["perfil", "proyectos"], "cta": { ... } },
  "hero": { ... },
  "cifras": [ ... ],
  "contenido": {
    "perfil": { ... },
    "servicios": { ... },
    "modelos": { ... },
    "herramientas": { ... },
    "trayectoria": { ... },
    "contacto": { ... }
  },
  "footer": { ... }
}
```

Consejos:

- Respeta las comas y las comillas dobles. Un JSON inválido rompe el build.
- VSCode marca el error en rojo; también puedes validar con `pnpm build`.
- Los textos con `<em>`, `<br />` o `<span>` se renderizan como HTML en el hero y en la pregunta de contacto.
- No borres `id` de una sección sin revisar `nav.items` y `secciones`.

### 7.2 Tokens que se sustituyen solos

En cualquier texto puedes usar:

| Token | Se convierte en |
|---|---|
| `{{modelos}}` | cantidad de modelos, con dos dígitos (`02`) |
| `{{niveles}}` | cantidad de secciones con `nivel: true` |
| `{{altura}}` | altura calculada de la axonométrica |
| `{{nombre}}` | nombre completo |
| `{{ciudad}}` | ciudad |
| `{{email}}` | correo |
| `{{whatsapp}}` | número de WhatsApp |
| `{{linkedin}}` | URL de LinkedIn |
| `{{certificado}}` | URL del certificado EFSET |
| `{{anio}}` | año del sitio |
| `{{marca}}` | marca corta |

Se resuelven en `src/lib/contenido.ts`. Si necesitas un token nuevo, se añade ahí.

### 7.3 Secciones y axonométrica

Cada objeto de `secciones` tiene:

```json
{
  "id": "perfil",
  "numero": "01",
  "nombre": "Perfil",
  "href": "#perfil",
  "meta": "Quién firma · L-02",
  "visible": true,
  "nivel": true
}
```

- `visible: false` la oculta del menú y de la figura.
- `nivel: true` la convierte en un piso de la axonométrica.
- El nombre se comparte entre el menú, la figura y la cabecera de la sección. El número solo aparece en la cabecera de la página, no en la figura.
- **La primera sección de la lista queda arriba en la axonométrica**; la última, abajo. Si reordenas las secciones, la figura cambia con ellas.
- `nav.items` usa los `id`, no los nombres.

**Importante:** la página tiene bloques escritos para las seis secciones actuales (`perfil`, `servicios`, `proyectos`, `herramientas`, `trayectoria`, `contacto`). Puedes ocultarlas, reordenar el menú y cambiar sus textos, pero **una sección nueva con otro `id` aparecerá en el menú y en la figura sin tener cuerpo en la página**. Para eso hace falta un bloque genérico (siguiente fase).

### 7.4 Modelos IFC

Dentro de `contenido.modelos.items`:

```json
{
  "id": "proyecto2",
  "indice": "02",
  "titulo": "Proyecto 2",
  "subtitulo": "Modelo de 7 niveles...",
  "meta": "Estructura · 7 niveles",
  "superficie": "",
  "archivo": "modelos/proyecto2-ligero.ifc",
  "peso": 993177,
  "nota": "IFC 2x3 · 7 niveles..."
}
```

- `archivo` es relativo a `public/`. No pongas `/` al inicio.
- `peso` es el tamaño **en bytes** del IFC. Se usa para el progreso `0,36 / 0,95 MB`.
- `superficie` es opcional; si está vacía no se muestra.
- Los nombres de archivo distinguen mayúsculas/minúsculas en Linux y GitHub Pages. Usa minúsculas y guiones.

Obtener el peso:

```powershell
# Windows
(Get-Item public\modelos\mi-modelo.ifc).Length
```

```bash
# Linux
stat -c%s public/modelos/mi-modelo.ifc
```

### 7.5 Añadir una imagen o icono a mano

1. Copia el archivo a `public/uploads/`.
2. En el JSON usa una ruta relativa: `"foto": "uploads/retrato.jpg"` o `"icono": "uploads/icono-revit.svg"`.
3. Los iconos se muestran a 38 × 38 px; usa SVG o PNG transparente.

También puedes subirlos desde el panel, que los guarda en esa misma carpeta.

---

## 8. Editar el CSS

Todo el diseño está en **`src/styles/global.css`**.

### 8.1 Variables de diseño

Al inicio del archivo, en `:root`, están los colores y medidas globales:

```css
:root {
  --papel: #f7f6f1;      /* fondo */
  --tinta: #101417;      /* texto principal */
  --grafito: #5b6266;    /* texto secundario */
  --linea: #cdc8ba;      /* líneas suaves */
  --senal: #c23a1f;      /* rojo de marcado */
  --azul: #2f5e7a;       /* retícula */
  --display: 'Archivo Variable', ...;
  --mono: 'IBM Plex Mono', ...;
}
```

Cambiar `--senal` cambia todos los acentos rojos del sitio. Cambiar `--papel` cambia el fondo general.

### 8.2 Zonas del archivo

| Zona | Qué controla |
|---|---|
| `:root` | colores, tipografías, ancho |
| `body` | fondo de retícula SVG |
| `.cabecera` | barra superior |
| `.hero` | portada, titular y botones |
| `.figura` / `.iso` | marco y SVG de la axonométrica |
| `.cifras` | franja de información general |
| `.perfil` / `.retrato` | perfil y foto |
| `.especialidades` | tarjetas de “Qué hago” |
| `.fila` / `.indice` | lista de modelos |
| `.tabla-software` | herramientas |
| `.trayectoria` | experiencia y formación |
| `.contacto` | contacto |
| `.pie` / `.rotulo` | footer |
| `@media` | adaptaciones a móvil (1080 px y 640 px) |

### 8.3 Probar un cambio de CSS

1. `pnpm dev`.
2. Abre `http://localhost:4321/`.
3. Edita `global.css`; el navegador recarga solo.
4. Usa las DevTools del navegador (`F12`) para probar valores antes de escribirlos.
5. Cuando esté listo: `pnpm build`, commit y push.

### 8.4 Cuidados

- No edites `dist/`: se borra en cada build.
- No uses `!important` salvo caso extremo; complica el mantenimiento.
- Si un estilo no aparece, revisa que el selector no esté dentro de un `<style>` de componente (los estilos de componente son locales).
- Respeta los `@media` existentes; si añades uno nuevo, pruébalo a 390 px, 768 px y 1440 px.

### 8.5 Cambiar la retícula de fondo

El fondo es un solo SVG repetido cada 50 px (para que Firefox no repinte cuatro gradientes). Está en `body`, propiedad `background-image`. Si cambias el color, cambia `%232f5e7a` (es `#2f5e7a` codificado para URL) y las opacidades `0.05` y `0.09`.

---

## 9. Editar la estructura (Astro)

Los archivos `.astro` tienen dos partes:

```astro
---
// 1. JavaScript que se ejecuta al construir el sitio
const titulo = 'Hola';
---
<!-- 2. HTML del componente -->
<h1>{titulo}</h1>
```

- `src/pages/index.astro` es la página única. Cada sección está envuelta en `{visible('perfil') && (...)}` para poder ocultarla desde el JSON.
- `src/components/Hoja.astro` dibuja el encabezado de cada sección (número, título, meta).
- `src/components/Estructura.astro` dibuja la axonométrica y sus enlaces.
- `src/components/Visor3D.astro` es el panel del visor IFC.
- `src/lib/visor3d.ts` contiene la lógica de three.js/web-ifc.
- `src/lib/iso.ts` calcula la geometría SVG; no se edita a mano salvo que quieras cambiar la forma del edificio.
- `src/layouts/Base.astro` contiene `<head>`, metadatos, scripts de aparición y paralaje.

Para cambiar un texto pequeño, casi siempre es mejor `sitio.json` o el panel. Para cambiar el orden de los elementos o añadir un bloque HTML, se edita el `.astro`.

---

## 10. Modelos IFC y visor

### 10.1 Dónde van

`public/modelos/`. En el JSON se referencian como `modelos/archivo.ifc`.

### 10.2 Límites

- El panel acepta hasta **12 MB** por archivo.
- Para móvil conviene quedarse por debajo de **5–10 MB**. Un IFC de 44 MB tarda y consume memoria.
- Si el IFC es grande, expórtalo sin muebles ni detalles innecesarios. Los muebles pueden ser el 40 % de la geometría.

### 10.3 Progreso de descarga

El visor muestra `descargado / total` usando `peso`. Si cambias el IFC y no actualizas `peso`, el texto será incorrecto (aunque nunca pasa del 100 % porque ya no calcula porcentaje).

### 10.4 Orientación

`src/lib/visor3d.ts` detecta el eje vertical comparando la extensión de la caja con el rango de `IfcBuildingStorey`. Si un modelo sale acostado, revisa esa lógica antes de rotarlo a mano.

### 10.5 El IFC viejo de 44 MB

No está en Git (se retiró) y `scripts/limpiar-dist.mjs` lo excluye de `dist/`. Si conservas una copia local en `public/modelos/Proyecto2.ifc`, Git la ignora y no se publica. No la vuelvas a agregar.

---

## 11. Panel de administración y Worker

### 11.1 Cómo funciona

```text
Navegador (/admin/)
   │  login + token de sesión
   ▼
Worker Cloudflare
   │  commit con la API de GitHub
   ▼
Repositorio (src/data/sitio.json o archivos subidos)
   │  push a main
   ▼
GitHub Actions → GitHub Pages
```

### 11.2 Secretos

Están en Cloudflare, **no en el repositorio**:

- `ADMIN_PASSWORD`: contraseña del panel.
- `SESSION_SECRET`: firma las sesiones (12 h).
- `GITHUB_TOKEN`: token fine-grained con **Contents: Read and write**.

Para cambiarlos:

```powershell
cd worker
powershell -ExecutionPolicy Bypass -File .\configurar-secretos.ps1
```

O manualmente:

```bash
cd worker
npx wrangler secret put ADMIN_PASSWORD
npx wrangler secret put SESSION_SECRET
npx wrangler secret put GITHUB_TOKEN
```

### 11.3 Variables del Worker

En `worker/wrangler.toml`:

```toml
GITHUB_REPO = "KryptAle/portafolio-civil"
GITHUB_BRANCH = "main"
ALLOWED_ORIGIN = "https://kryptale.github.io"
```

### 11.4 Actualizar el Worker

```bash
cd worker
npx wrangler login
npx wrangler deploy
```

Si estás en el equipo actual y ya está autenticado, basta `npx wrangler deploy`.

### 11.5 Ver errores del Worker

```bash
cd worker
npx wrangler tail
```

Mientras guardas desde el panel, `tail` muestra los errores reales (token inválido, conflicto de `sha`, etc.).

### 11.6 Seguridad

- No pongas la contraseña ni el token en `sitio.json`, en el CSS ni en ningún archivo del repo.
- El token debe tener solo permiso de contenidos sobre este repositorio.
- Si sospechas que se filtró, revócalo en GitHub y crea otro; actualiza el secreto.
- El panel no está enlazado en la web, pero la protección real es la contraseña del Worker.

---

## 12. Git y despliegue

### 12.1 Lo básico

```bash
git status
git diff
git add -A
git commit -m "Mensaje claro"
git push
```

### 12.2 Qué pasa al hacer push

`.github/workflows/deploy.yml`:

1. Instala pnpm y Node 24.
2. `pnpm install`.
3. `pnpm build` con `BASE_PATH=/portafolio-civil`.
4. Sube `dist/` como artefacto de Pages.
5. Publica.

Puedes ver el progreso en **Actions** del repositorio.

### 12.3 Publicar sin push (forzar)

```bash
gh workflow run deploy.yml
gh run list --limit 1
gh run watch
```

### 12.4 Si la web da 404

Comprueba en GitHub:

1. **Settings → Pages → Source: GitHub Actions**.
2. Si el repositorio estuvo privado, Pages se desactiva. Al volver a público hay que **recrear** la configuración: Source → GitHub Actions y lanzar el workflow.
3. Verifica que el último run de Actions terminó en verde.

### 12.5 Dominio propio (cuando lo compres)

1. En GitHub → Settings → Pages → Custom domain, escribe el dominio y guarda.
2. En tu proveedor DNS crea los registros que GitHub indique (`A` para el dominio raíz o `CNAME` para `www`).
3. Activa “Enforce HTTPS”.
4. En `astro.config.mjs`, cambia `site` por tu dominio.
5. En el workflow, cambia `BASE_PATH` a `/` si el sitio va en la raíz del dominio.
6. En `worker/wrangler.toml`, cambia `ALLOWED_ORIGIN` al nuevo dominio y vuelve a desplegar el Worker.
7. Vuelve a ejecutar el workflow.

No hay rutas absolutas en el contenido ni en los componentes: todo usa `BASE_PATH` y `ruta()`.

### 12.6 Repositorio privado y web pública

GitHub Pages **no funciona con repositorios privados en el plan Free**. Si pasas el repositorio a privado, Pages se desactiva y la web da 404, aunque luego lo vuelvas a poner público.

Opciones:

| Opción | Coste | URL | Complejidad |
|---|---|---|---|
| GitHub Pro | ~4 USD/mes | Se mantiene `kryptale.github.io/portafolio-civil/` | Baja |
| Repo privado + repo público de despliegue | Gratis | Se mantiene la misma URL | Media |
| Cloudflare Pages con repo privado | Gratis | Cambia a `*.pages.dev` o dominio propio | Media |

- **GitHub Pro**: el repositorio puede ser privado y Pages sigue publicando la web. El sitio sigue siendo público; lo privado es el código y el historial.
- **Repo privado + repo público de despliegue**: el repositorio fuente se queda privado; un workflow compila y empuja solo `dist/` a un repositorio público llamado igual (`portafolio-civil`), que es el que publica Pages. Se conserva la URL, pero hay que configurar un token o deploy key y cambiar el repo del Worker.
- **Cloudflare Pages**: acepta repositorios privados gratis, pero la URL cambia. Si el QR ya apunta a GitHub Pages, habría que usar un dominio propio o mantener la URL antigua.

Importante: aunque el código esté privado, **el contenido de la web sigue siendo público** (textos, imágenes e IFC se descargan al visitarla). Lo que se protege es el código y el historial, no los archivos publicados.

No cambies el repositorio a privado sin tener una de estas opciones lista.

---

## 13. Problemas frecuentes

### “pnpm no se reconoce”

```powershell
corepack enable
corepack prepare pnpm@11 --activate
pnpm -v
```

Si sigue, `npm install -g pnpm@11`.

### El puerto 4321 está ocupado

```bash
pnpm exec astro preview stop
```

O cierra el proceso de Astro y vuelve a `pnpm dev`.

### La web se ve con acentos raros (`Ã³`, `â€`)

El archivo se guardó con doble codificación. En VSCode:

1. Abre el archivo.
2. Abajo a la derecha pulsa **UTF-8**.
3. Elige **Reopen with Encoding → UTF-8**.
4. Si el texto sigue mal, corrige las palabras afectadas y guarda como UTF-8.

**Nunca** uses en PowerShell `Get-Content ... | Set-Content ...` para editar archivos con acentos: puede cambiar la codificación. Usa VSCode, `write`/`edit` de DSH o Python con `encoding="utf-8"`.

### El panel dice “Sesión no válida” o “Contraseña incorrecta”

- Vuelve a iniciar sesión.
- Si cambiaste `SESSION_SECRET`, todas las sesiones anteriores quedan invalidadas.
- Revisa que la URL del Worker sea la correcta.

### El panel guarda pero da error 500

- El `GITHUB_TOKEN` no tiene permiso `Contents: Read and write`, o expiró.
- El repo o la rama en `wrangler.toml` no coinciden.
- Mira `npx wrangler tail` para el mensaje exacto.

### El panel da error 409

Otra persona o pestaña guardó antes. Recarga el panel y vuelve a aplicar el cambio.

### Subida rechazada

El archivo supera los 12 MB. Comprime el IFC o reduce la geometría.

### El sitio compila pero no se ve un cambio

- GitHub Pages tarda ~40 s.
- Recarga con `Ctrl + F5`.
- Revisa que el commit esté en `main` y el workflow en verde.

### El visor no carga

- Comprueba que `public/web-ifc.wasm` existe.
- Revisa la consola del navegador.
- Si cambiaste `web-ifc`, vuelve a copiar `node_modules/web-ifc/web-ifc.wasm` a `public/`.

### El modelo sale acostado o descentrado

Está en `src/lib/visor3d.ts`: detección de eje vertical y encuadre de cámara. Es de las partes más delicadas; haz cambios pequeños y prueba con los dos modelos.

---

## 14. Copias de seguridad y qué no subir

### 14.1 El repositorio es la copia principal

Todo lo necesario para reconstruir la web está en Git, salvo:

- Los secretos de Cloudflare.
- El token de GitHub.
- Copias locales de IFC grandes que no se publican.

Guarda los secretos en un gestor de contraseñas. Si pierdes el token, se crea otro; si pierdes la contraseña, se cambia con el script.

### 14.2 No subir

- `node_modules/`, `dist/`, `.astro/`
- `.env`, `.dev.vars`, `worker/.wrangler/`
- Tokens, contraseñas, archivos `.pem`
- IFC de más de 12 MB (mejor optimizarlos)
- `public/modelos/Proyecto2.ifc` (el viejo de 44 MB; ya está ignorado)

### 14.3 Respaldar el IFC original

Si quieres conservar el modelo pesado, guárdalo fuera del repositorio, por ejemplo en un disco externo o la nube. En este equipo hay una copia en `.tooling/Proyecto2-original.ifc` (fuera de Git).

---

## 15. Chuleta de comandos

```bash
# Instalar
pnpm install

# Desarrollo
pnpm dev

# Compilar como producción
BASE_PATH=/portafolio-civil pnpm build
pnpm preview

# Git
git status
git add -A
git commit -m "Cambio"
git push

# Forzar despliegue
gh workflow run deploy.yml

# Worker
cd worker
npx wrangler deploy
npx wrangler tail

# Secretos
npx wrangler secret put ADMIN_PASSWORD
npx wrangler secret put SESSION_SECRET
npx wrangler secret put GITHUB_TOKEN
```

En Windows PowerShell, el `BASE_PATH` se pone así:

```powershell
$env:BASE_PATH = "/portafolio-civil"
pnpm build
```

---

## 16. Orden recomendado para un cambio

1. ¿Es texto, foto, icono, modelo o herramienta? → panel `/admin/`.
2. ¿Es color, espaciado o tipografía? → `src/styles/global.css`.
3. ¿Es estructura HTML o lógica? → `src/pages/index.astro` o el componente correspondiente.
4. `pnpm dev` y probar.
5. `pnpm build` para confirmar que compila.
6. `git add -A`, `git commit`, `git push`.
7. Esperar Actions y recargar con `Ctrl + F5`.

---

## 17. Si algo se rompe

No entres en pánico y no borres archivos. Git guarda todo:

```bash
git status
git log --oneline -10
git diff
```

Para volver a la última versión publicada:

```bash
git fetch origin
git reset --hard origin/main
```

Eso descarta cambios locales. Si quieres conservarlos, haz antes:

```bash
git stash
```

O crea una rama:

```bash
git switch -c intento
```

---

## 18. Contacto técnico

- Repositorio: https://github.com/KryptAle/portafolio-civil
- Panel: https://kryptale.github.io/portafolio-civil/admin/
- Worker: https://portafolio-admin.ale-aguilera-ve.workers.dev

Si dentro de meses no recuerdas algo, empieza por este documento y por `README.md`. La estructura está pensada para que el contenido viva en un solo JSON y el diseño en un solo CSS.
