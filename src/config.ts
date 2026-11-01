/**
 * Compatibilidad: el contenido vive en src/data/sitio.json y se resuelve en
 * src/lib/contenido.ts. Aquí quedan la base pública y el helper de rutas.
 */

import { sitio, navEnlaces } from './lib/contenido';

export { sitio };

/** Navegación principal resuelta desde las secciones. */
export const navegacion = navEnlaces.map(({ texto, href }) => ({
  texto,
  href: href.startsWith('#') ? `/${href}` : href,
}));

/**
 * Base pública del sitio. En local es '/'; en GitHub Pages se compila con
 * BASE_PATH=/portafolio-civil para que todos los enlaces funcionen bajo la
 * subcarpeta del repositorio.
 */
export const base = import.meta.env.BASE_URL;

/** Convierte una ruta lógica ('/proyectos') en la URL final con su base. */
export const ruta = (destino = '/') => {
  const raiz = base.endsWith('/') ? base : `${base}/`;
  const limpio = destino.replace(/^\//, '');
  return limpio ? `${raiz}${limpio}` : raiz;
};
