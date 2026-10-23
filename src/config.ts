/**
 * Datos del sitio en un solo lugar.
 * Cambia aquí el nombre, correo y ciudad; se propagan a todas las páginas.
 */
export const sitio = {
  nombre: 'Alejandro Aguilera',
  nombreCorto: 'A. Aguilera',
  marca: 'Aguilera',
  marcaSigla: 'AA',
  titulo: 'Ingeniero civil',
  especialidad: 'Digitalización BIM · Revit',
  ciudad: 'Caracas, Venezuela',
  email: 'hola@alejandroaguilera.ing',
  telefono: '+58 412 000 0000',
  whatsapp: '584120000000',
  linkedin: 'https://www.linkedin.com/in/alejandroaguilera',
  anio: 2026,
  descripcion:
    'Portafolio BIM: digitalizo planos 2D en modelos Revit. Ejercicios de modelado con alcance, nivel de desarrollo y criterio técnico.',
};

export const navegacion = [
  { texto: 'Perfil', href: '/#perfil' },
  { texto: 'Proyectos', href: '/proyectos' },
];

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
