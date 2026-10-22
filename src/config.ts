/**
 * Datos del sitio en un solo lugar.
 * Cambia aquí el nombre, correo y ciudad; se propagan a todas las páginas.
 */
export const sitio = {
  nombre: 'Alejandro Rivas',
  nombreCorto: 'A. Rivas',
  marca: 'Rivas',
  marcaSigla: 'AR',
  titulo: 'Ingeniero civil',
  especialidad: 'Estructuras · BIM · Obra',
  ciudad: 'Caracas, Venezuela',
  email: 'hola@alejandrorivas.ing',
  telefono: '+58 412 000 0000',
  whatsapp: '584120000000',
  linkedin: 'https://www.linkedin.com/in/alejandrorivas',
  anio: 2026,
  descripcion:
    'Portafolio de ingeniería civil: cálculo estructural, coordinación BIM y dirección de obra para edificaciones e infraestructura.',
};

export const navegacion = [
  { texto: 'Proyectos', href: '/proyectos' },
  { texto: 'Sobre mí', href: '/sobre-mi' },
  { texto: 'Contacto', href: '/contacto' },
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
