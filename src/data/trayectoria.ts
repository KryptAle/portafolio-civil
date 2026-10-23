/**
 * Experiencia y formación.
 * Contenido de muestra: reemplaza cargos, fechas e instituciones por los reales.
 */

export interface Hito {
  periodo: string;
  cargo: string;
  detalle: string;
  lugar: string;
}

export const experiencia: Hito[] = [
  {
    periodo: '2024 — hoy',
    cargo: 'Modelador BIM independiente',
    detalle:
      'Digitalización de planos 2D a modelos Revit para estudios de arquitectura y clientes particulares.',
    lugar: 'Remoto',
  },
  {
    periodo: '2022 — 2024',
    cargo: 'Coordinador BIM',
    detalle:
      'Federación de modelos de arquitectura y estructura, detección de interferencias y láminas de coordinación.',
    lugar: 'Caracas',
  },
  {
    periodo: '2020 — 2022',
    cargo: 'Proyectista y modelador',
    detalle:
      'Levantamiento de planos, modelado de arquitectura y documentación de obra.',
    lugar: 'Caracas',
  },
  {
    periodo: '2018 — 2020',
    cargo: 'Ingeniero civil junior',
    detalle: 'Apoyo en cálculo estructural, cómputos y seguimiento de obra.',
    lugar: 'Venezuela',
  },
];

export interface Curso {
  anio: string;
  titulo: string;
  detalle: string;
}

export const formacion: Curso[] = [
  {
    anio: '2024',
    titulo: 'Autodesk Certified Professional — Revit Structure',
    detalle: 'Certificación de modelado estructural y documentación.',
  },
  {
    anio: '2023',
    titulo: 'BIM Management',
    detalle: 'Gestión de modelos federados y flujos de coordinación.',
  },
  {
    anio: '2022',
    titulo: 'Diseño sismorresistente',
    detalle: 'Análisis modal y diseño por desempeño.',
  },
  {
    anio: '2018',
    titulo: 'Ingeniería civil',
    detalle: 'Mención Estructuras.',
  },
];
