import { rm } from 'node:fs/promises';

/**
 * El repositorio conserva el IFC original de 44 MB como respaldo, pero no debe
 * viajar en el sitio publicado: el visor usa la versión ligera.
 */
const sobrantes = ['dist/modelos/Proyecto2.ifc'];

for (const ruta of sobrantes) {
  try {
    await rm(ruta);
    console.log(`excluido del deploy: ${ruta}`);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.warn(`no se pudo excluir ${ruta}:`, error.message);
    }
  }
}
