# Rivas — portafolio de ingeniería civil

Borrador de sitio web construido con **Astro**. La dirección visual se llama
«Papel, tinta y señal»: el sitio se lee como un juego de planos — retícula,
rótulos, cotas y una sola tinta de señal (naranja de obra).

## Qué incluye

- Inicio con hero isométrico generado en el build (SVG, sin JavaScript de dibujo).
- Índice de proyectos con rejilla, filtros por disciplina y fichas completas.
- Fichas con métricas, reto / solución / resultado, normativa, software y entregables.
- Láminas técnicas ilustrativas (planta, corte y detalle) dibujadas como SVG.
- Perfil con trayectoria, matriz de software y formación.
- Contacto con formulario que abre el cliente de correo (sin backend).
- Diseño responsive, foco visible, `prefers-reduced-motion` y metadatos Open Graph.

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
| Agregar o editar proyectos | `src/data/proyectos.json` |
| Ajustar colores, tipografía, espaciado | `src/styles/global.css` |
| Cambiar la estructura del hero | `src/components/Estructura.astro` y `src/lib/iso.ts` |
| Cambiar las portadas de proyecto | `src/components/ProyectoCover.astro` |
| Cambiar las láminas técnicas | `src/components/Plano.astro` |
| Editar textos de una página | `src/pages/*.astro` |

### Agregar un proyecto

1. Copia un objeto de `src/data/proyectos.json` y cambia `slug`, `titulo` y el resto.
2. `tipo` controla la ilustración de portada: `torre`, `puente`, `nave` o `tanque`.
3. `indice` es el número que aparece en la fila y en la portada (`01`, `02`…).
4. La ficha se genera sola en `/proyectos/<slug>`.

Los campos obligatorios para que la ficha se vea completa: `slug`, `titulo`,
`subtitulo`, `tipo`, `disciplina`, `anio`, `ubicacion`, `rol`, `estado`,
`resumen`, `reto`, `solucion`, `resultado`, `metricas`, `software` y `entregables`.

## Sobre el contenido

**Todo el contenido es de muestra.** Nombres de proyectos, clientes, cifras y
certificaciones son ficticios y sirven para evaluar el diseño. Antes de publicar:

- Reemplaza los proyectos por obras reales con autorización de difusión.
- Cambia el retrato («Fotografía pendiente») por una foto profesional.
- Añade el CV en PDF y enlázalo donde corresponda.
- Sustituye las láminas ilustrativas por planos y renders reales.
- Revisa la normativa citada y la colegiatura.

## Decisiones técnicas

- **Sin frameworks de UI**: HTML, CSS y un único script compartido. El sitio
  pesa poco y no depende de hidratación.
- **SVG generado en el build**: la estructura isométrica y las láminas se
  calculan en `src/lib/iso.ts` y en los componentes; el navegador solo recibe
  el resultado, sin librerías de dibujo.
- **Datos en JSON**: una ficha nueva no requiere tocar HTML.
- **Formulario sin backend**: arma un `mailto:` con el mensaje. Para producción
  conviene un endpoint (Netlify Forms, Formspree o similar).
- **Archivos .rvt y .dwg**: no se sirven desde el sitio. Cada ficha ofrece
  solicitarlos bajo acuerdo; la experiencia web se resuelve con láminas,
  imágenes y video.

## Pendientes sugeridos

1. Portada real por proyecto y galería de fotos/renders.
2. Video de recorrido (YouTube no listado) en las fichas destacadas.
3. Visor 3D (`<model-viewer>` con GLB) para una o dos obras.
4. Página de privacidad y aviso legal si se conecta el formulario a un servicio.
5. Analítica ligera (Plausible/Umami) y `sitemap.xml`.
6. Versión en inglés.

## Estructura

```
src/
  config.ts            datos personales y navegación
  data/proyectos.json  contenido de proyectos
  lib/iso.ts           geometría isométrica del hero
  styles/global.css    sistema visual completo
  layouts/Base.astro   head, header, footer, scripts
  components/          Header, Footer, Hoja, Estructura, ProyectoCover, Plano, Corte
  pages/
    index.astro
    proyectos/index.astro
    proyectos/[slug].astro
    sobre-mi.astro
    contacto.astro
    404.astro
```
