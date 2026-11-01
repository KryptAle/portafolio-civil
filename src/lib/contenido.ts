/**
 * Fuente única de contenido.
 * Todo lo editable vive en src/data/sitio.json; aquí se resuelven las
 * referencias (secciones, navegación, contadores y textos compartidos).
 */

import datos from '../data/sitio.json';

export type Seccion = {
  id: string;
  numero: string;
  nombre: string;
  href: string;
  meta: string;
  visible: boolean;
  nivel: boolean;
};

export type Enlace = {
  texto: string;
  href: string;
  id?: string;
};

export const contenido = datos;
export const sitio = datos.sitio;
export const secciones = datos.secciones as Seccion[];

export const seccionesVisibles = secciones.filter((seccion) => seccion.visible);

/** Niveles que dibuja la axonométrica: una sección visible por nivel. */
export const niveles = seccionesVisibles.filter((seccion) => seccion.nivel);

export const proyectos = datos.contenido.modelos.items;
export const modelosPublicados = proyectos.length;

const ALTURA_PISO = 3.2;
const altura = Math.max(niveles.length - 1, 1) * ALTURA_PISO;

const valores: Record<string, string> = {
  nombre: sitio.nombre,
  marca: sitio.marca,
  ciudad: sitio.ciudad,
  email: sitio.email,
  whatsapp: sitio.whatsapp,
  linkedin: sitio.linkedin,
  certificado: sitio.certificadoIngles,
  anio: String(sitio.anio),
  modelos: String(modelosPublicados).padStart(2, '0'),
  niveles: String(niveles.length),
  altura: altura.toFixed(2).replace('.', ','),
};

/** Sustituye {{claves}} por sus valores; deja el texto intacto si no existe. */
export const t = (texto: string): string =>
  texto.replace(/\{\{\s*([\w-]+)\s*\}\}/g, (original, clave: string) =>
    clave in valores ? valores[clave] : original,
  );

const buscarSeccion = (id: string) => secciones.find((seccion) => seccion.id === id);

export const navEnlaces: Enlace[] = datos.nav.items
  .map((id) => buscarSeccion(id))
  .filter((seccion): seccion is Seccion => Boolean(seccion && seccion.visible))
  .map((seccion) => ({ id: seccion.id, texto: seccion.nombre, href: seccion.href }));

export const navCta = datos.nav.cta;

export const seccion = (id: string): Seccion | undefined => buscarSeccion(id);

/** Etiquetas de la axonométrica, en orden de nivel. */
export const etiquetasNivel = niveles.map((nivel) => ({
  numero: nivel.numero,
  nombre: nivel.nombre,
  href: nivel.href,
}));

export const perfil = datos.contenido.perfil;
export const servicios = datos.contenido.servicios.items;
export const modelos = datos.contenido.modelos;
export const herramientas = datos.contenido.herramientas.items;
export const trayectoria = datos.contenido.trayectoria;
export const contacto = datos.contenido.contacto;
export const footer = datos.footer;
