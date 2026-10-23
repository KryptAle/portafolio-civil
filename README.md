# Rivas — portafolio BIM

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

- **Una sola página de aterrizaje** pensada para un QR en el currículum: perfil,
  servicios, modelos, herramientas y contacto, sin saltos entre pestañas.
- **Índice de modelos** en `/proyectos`, con filtros por disciplina.
- **Fichas individuales** con alcance, LOD, horas, reto de interpretación,
  criterio de modelado, resultado y nota de autoría.
- Hero axonométrico generado en el build, con ejes, cotas y niveles (SVG puro).
- Láminas técnicas ilustrativas (planta, corte y detalle) dibujadas como SVG.
- Contacto por canales directos (correo, WhatsApp, LinkedIn), sin formulario.
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
| Agregar o editar modelos | `src/data/proyectos.json` |
| Ajustar colores, retícula, tipografía | `src/styles/global.css` |
| Cambiar el hero (ejes, cotas, niveles) | `src/components/Estructura.astro` y `src/lib/iso.ts` |
| Cambiar las portadas de proyecto | `src/components/ProyectoCover.astro` |
| Cambiar las láminas técnicas | `src/components/Plano.astro` |
| Editar textos de una página | `src/pages/*.astro` |

### Agregar un modelo

1. Copia un objeto de `src/data/proyectos.json` y cambia `slug`, `titulo` y el resto.
2. `tipo` controla la ilustración de portada: `torre`, `puente`, `nave` o `tanque`.
3. `categoria` alimenta los filtros (`Arquitectura`, `Estructura`, `Metálica`,
   `Hidráulica` u otra que agregues).
4. `indice` es el número que aparece en la fila y en la portada.
5. La ficha se genera sola en `/proyectos/<slug>`.

Campos que usa la ficha: `slug`, `titulo`, `subtitulo`, `tipo`, `disciplina`,
`categoria`, `anio`, `alcance`, `lod`, `horas`, `planos`, `superficie`, `fuente`,
`rol`, `noIncluye`, `resumen`, `reto`, `criterio`, `resultado`, `metricas`,
`estandares`, `software`, `entregables` y `solicitarArchivos`.

## Sobre el contenido

**Los modelos publicados son ejercicios de digitalización BIM.** Parten de planos
2D de referencia pública (PDF o imagen) que se reconstruyeron en Revit para
demostrar manejo de la herramienta. No son obras diseñadas por el autor, y el
sitio lo declara en la portada y en cada ficha con una nota de autoría.

Antes de publicar contenido definitivo:

- Reemplaza los cuatro modelos de muestra por los tuyos, con capturas reales
  de Revit (vistas 3D, plantas, tablas de planificación).
- Ajusta `fuente` y `noIncluye` en cada ficha según el plano que usaste.
- Cambia el retrato («Fotografía pendiente») por una foto profesional.
- Añade el CV en PDF y enlázalo en la portada.
- Revisa la nota de autoría: debe nombrar a los autores del diseño original
  cuando corresponda.
- Sustituye las láminas ilustrativas por planos y capturas reales.

## Decisiones técnicas

- **Sin frameworks de UI**: HTML, CSS y un script compartido. El sitio pesa poco
  y no depende de hidratación.
- **SVG generado en el build**: la axonométrica y las láminas se calculan en
  `src/lib/iso.ts` y en los componentes; el navegador solo recibe el resultado.
- **Datos en JSON**: una ficha nueva no requiere tocar HTML.
- **Contacto sin formulario**: la portada solo muestra canales directos (correo,
  WhatsApp, LinkedIn). Así no hay backend, ni datos que guardar, ni spam.
- **Archivos .rvt**: no se sirven desde el sitio. Cada ficha abre un correo con
  el asunto del modelo ya redactado y la entrega se coordina por esa vía.

## Pendientes sugeridos

1. Capturas reales de cada modelo y una galería por ficha.
2. Recorrido en video (YouTube no listado) para uno o dos modelos.
3. Visor 3D (`<model-viewer>` con GLB exportado de Revit) en la ficha destacada.
4. CV en PDF enlazado desde el hero.
5. Analítica ligera (Plausible/Umami) y `sitemap.xml`.
6. Versión en inglés.

## Estructura

```
src/
  config.ts            datos personales, navegación y helper de base
  data/proyectos.json  contenido de los modelos
  lib/iso.ts           geometría axonométrica del hero
  styles/global.css    sistema visual completo
  layouts/Base.astro   head, header, footer, scripts
  components/          Header, Footer, Hoja, Estructura, ProyectoCover, Plano, Corte
  pages/
    index.astro           portada con perfil, servicios, modelos, herramientas y contacto
    proyectos/index.astro índice con filtros
    proyectos/[slug].astro
    sobre-mi.astro        redirección a /#perfil
    contacto.astro        redirección a /#contacto
    404.astro
```
