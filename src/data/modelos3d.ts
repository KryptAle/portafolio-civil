/**
 * Modelos disponibles en el visor 3D.
 * Para publicar uno nuevo: copia el .ifc a public/modelos/ y agrega su entrada aquí.
 */

export interface Modelo3D {
  id: string;
  titulo: string;
  archivo: string;
  nota: string;
}

export const modelos3d: Modelo3D[] = [
  {
    id: 'proyecto1',
    titulo: 'Proyecto 1',
    archivo: 'modelos/proyecto1.ifc',
    nota: 'IFC 2x3 · 4 niveles · exportado de Revit 2025. Modelo de demostración.',
  },
];
