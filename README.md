# Aguilera — portafolio BIM

Sitio construido con **Astro** para un ingeniero civil que digitaliza planos:
convierte documentación 2D en modelos Revit. La dirección visual se llama
«Lámina E-01»: el sitio se lee como un plano de estructura — retícula, ejes,
cotas, rótulos y una tinta de señal para el marcado.

## Publicación

| | |
|---|---|
| **Sitio** | https://kryptale.github.io/portafolio-civil/ |
| **Repositorio** | https://github.com/KryptAle/portafolio-civil |
| **Despliegue** | GitHub Actions en cada push a `main` |

El flujo `.github/workflows/deploy.yml` compila con `BASE_PATH=/portafolio-civil`
y publica en GitHub Pages. En local la base es `/`, así que `pnpm dev` funciona
en la raíz. Para publicar un cambio:

```bash
git add -A
git commit -m "describe el cambio"
git push
```

En uno o dos minutos el sitio se reconstruye solo. El progreso se ve en la
pestaña **Actions** del repositorio.

## Qué incluye

- **Una sola página de aterrizaje**, sin pestañas: perfil, servicios, modelos,
  herramientas, trayectoria y contacto. Es la página a la que apunta el QR del CV.
- **Lista de modelos** con superficie modelada, disciplina, LOD y año, más nota
  de autoría. Sin fichas ni rutas adicionales.
- Hero axonométrico generado en el build, con ejes, cotas y niveles (SVG puro).
- **Visor IFC 3D** en la columna derecha de «Modelos BIM», con carga bajo demanda
  (rotar, zoom y encuadrar; sin edición ni medición).
- Láminas técnicas ilustrativas (planta, corte y detalle) dibujadas como SVG.
- Contacto por canales directos (correo, WhatsApp, LinkedIn), sin formulario.
- **Certificado de inglés EFSET** enlazado desde «Idiomas» y desde una tarjeta
  destacada en «Trayectoria».
- Diseño responsive, foco visible, `prefers-reduced-motion` y metadatos Open Graph.
- `/sobre-mi` y `/contacto` redirigen a la página principal para no romper enlaces
  antiguos o compartidos.

## Requisitos

- Node 22.23 o superior (Astro 7).
- pnpm.

```bash
pnpm install
pnpm dev       # http://localhost:4321
pnpm build     # genera dist/
pnpm preview   # sirve dist/ en http://localhost:4321
```

## Dónde tocar cada cosa

| Quiero… | Archivo |
|---|---|
| Cambiar nombre, correo, ciudad, redes | `src/config.ts` |
| Cambiar el enlace del certificado de inglés | `src/config.ts` (`certificadoIngles`) |
| Agregar o editar modelos | `src/data/proyectos.json` |
| Publicar un modelo en el visor 3D | `src/data/proyectos.json` y `public/modelos/` |
| Cambiar el visor (cámara, luces) | `src/lib/visor3d.ts` y `src/components/Visor3D.astro` |
| Cambiar experiencia y formación | `src/data/trayectoria.ts` |
| Ajustar colores, retícula, tipografía | `src/styles/global.css` |
| Cambiar el hero (ejes, cotas, niveles) | `src/components/Estructura.astro` y `src/lib/iso.ts` |
| Cambiar las portadas de proyecto | `src/components/ProyectoCover.astro` |
| Cambiar las láminas técnicas | `src/components/Plano.astro` |
| Editar textos de una página | `src/pages/*.astro` |

### Agregar un modelo

1. Copia un objeto de `src/data/proyectos.json` y cambia `titulo`, `archivo` y el resto.
2. `tipo` controla la ilustración de portada: `torre`, `puente`, `nave` o `tanque`.
3. `indice` es el número que aparece en la fila y en la portada.
4. `archivo` es el IFC que carga el visor al seleccionar esa fila.
5. `superficie` se muestra como «Superficie modelada» si tiene un valor.

La lista de la portada usa `titulo`, `subtitulo`, `superficie`, `meta`, `tipo`,
`indice` y `archivo`.

## Visor 3D

La portada muestra el visor en la columna derecha del índice de modelos
(compacto, 300 px). Es de solo lectura: rotar con el mouse o el dedo, zoom con la
rueda o pinza, y un botón para reencuadrar. No edita, no mide y no exporta.

El visor se carga **solo al pulsar «Cargar visor 3D»**. La visita normal no
descarga three.js, web-ifc, el wasm ni el IFC. Al abrirlo, la primera carga ronda
los 4 MB comprimidos; el navegador los cachea.

El modelo se gira automáticamente a Z-arriba: se compara la extensión de cada eje
con el rango de niveles (`IfcBuildingStorey`) y se elige el eje vertical. Así
funcionan los IFC exportados con la altura en X, en Y o en Z.

### Publicar un modelo

1. Exporta el modelo a **IFC** desde Revit (IFC 2x3 o IFC4).
2. Copia el archivo a `public/modelos/mi-modelo.ifc`.
3. Agrega la entrada en `src/data/proyectos.json`:
   ```json
   {
     "id": "mi-modelo",
     "indice": "03",
     "titulo": "Mi modelo",
     "subtitulo": "Descripción breve",
     "tipo": "torre",
     "meta": "Estructura · 5 niveles",
     "superficie": "",
     "archivo": "modelos/mi-modelo.ifc",
     "nota": "IFC 2x3 · 5 niveles · exportado de Revit"
   }
   ```
4. Commit y push. GitHub Pages reconstruye y el modelo aparece.

Cada fila de la lista es un botón: al pulsarla, el visor carga ese archivo y el
resto se atenúa. La primera vez descarga y procesa el IFC; después el navegador
lo cachea. Los modelos grandes muestran el progreso de descarga en porcentaje.

El motor `web-ifc` se sirve desde `public/web-ifc.wasm`. Si actualizas la
dependencia, vuelve a copiar `node_modules/web-ifc/web-ifc.wasm` a `public/`.

### Formatos: por qué IFC

| Formato | Sirve para visor web | Nota |
|---|---|---|
| **IFC** | Sí | OpenBIM, geometría + propiedades, soporte maduro (`web-ifc`) |
| DXF | No recomendable | CAD sin semántica BIM, archivo pesado, sin materiales |
| DWFx | No | Empaquetado de Autodesk para visualización/impresión; sin visor web fiable |
| GLB | Sí (alternativa) | Muy liviano, pero hay que convertir y se pierden propiedades IFC |

### Protección del modelo

El visor no ofrece descarga, bloquea el menú contextual del canvas y muestra una
marca de autoría. **Eso es disuasión, no seguridad**: cualquier visor web descarga
el archivo para poder dibujarlo, y con las herramientas del navegador se puede
recuperar. Para protección real el archivo no debe salir del servidor:

- renderizado en servidor (solo imágenes o video),
- URL firmadas con autenticación (Supabase, Cloudflare R2 + Worker),
- un servicio como Autodesk Platform Services.

Se puede implementar más adelante; para el portafolio actual, la marca de agua y
la nota de uso suelen ser suficientes.

### ¿Panel de administración o backend?

Hoy no hay backend: publicar un modelo es copiar el archivo y hacer push. Para
subir desde el navegador haría falta autenticación + almacenamiento (Supabase
Storage o Cloudflare R2 con un Worker) y un formulario; es una fase 2 razonable,
pero no es necesaria para empezar.

## Sobre el contenido

**Los modelos publicados son ejercicios de digitalización BIM.** Parten de planos
2D de referencia pública (PDF o imagen) que se reconstruyeron en Revit para
demostrar manejo de la herramienta. No son obras diseñadas por el autor, y el
sitio lo declara en la portada con una nota de autoría.

Antes de publicar contenido definitivo:

- Reemplaza los cuatro modelos de muestra por los tuyos, con capturas reales
  de Revit (vistas 3D, plantas, tablas de planificación).
- Ajusta `superficie` y `noIncluye` en `proyectos.json` según cada modelo.
- Cambia el retrato («Fotografía pendiente») por una foto profesional.
- Añade el CV en PDF y enlázalo en la portada.
- Revisa la nota de autoría: debe nombrar a los autores del diseño original
  cuando corresponda.
- Sustituye las láminas ilustrativas por planos y capturas reales.

## Decisiones técnicas

- **Una sola página**: no hay rutas de proyectos ni fichas; todo se resuelve en
  la portada, que es la que recibe el QR.
- **Sin frameworks de UI**: HTML, CSS y un script compartido. El sitio pesa poco
  y no depende de hidratación.
- **SVG generado en el build**: la axonométrica y las láminas se calculan en
  `src/lib/iso.ts` y en los componentes; el navegador solo recibe el resultado.
- **Datos en JSON**: un modelo nuevo no requiere tocar HTML.
- **Contacto sin formulario**: la portada solo muestra canales directos (correo,
  WhatsApp, LinkedIn). Así no hay backend, ni datos que guardar, ni spam.
- **Archivos .rvt**: no se sirven desde el sitio. La entrega se coordina por correo.

## Pendientes sugeridos

1. Capturas reales de cada modelo y una galería en la portada.
2. Preconvertir IFC a GLB + Draco si se quiere todavía más velocidad.
3. CV en PDF enlazado desde el hero.
4. Analítica ligera (Plausible/Umami) y `sitemap.xml`.
5. Versión en inglés.

## Estructura

```
src/
  config.ts            datos personales, navegación y helper de base
  data/proyectos.json  contenido de los modelos
  data/trayectoria.ts  experiencia y formación
  lib/iso.ts           geometría axonométrica del hero
  lib/visor3d.ts       visor IFC (three.js + web-ifc)
  styles/global.css    sistema visual completo
  layouts/Base.astro   head, header, footer, scripts
  components/          Header, Footer, Hoja, Estructura, ProyectoCover, Plano, Visor3D
  pages/
    index.astro           única página: perfil, servicios, modelos, herramientas, trayectoria y contacto
    sobre-mi.astro        redirección a /#perfil
    contacto.astro        redirección a /#contacto
    404.astro
public/
  modelos/              archivos .ifc publicados
  web-ifc.wasm          motor de lectura IFC (copia estable)
```
