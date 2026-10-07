import { loadXML } from './engine/assets.js';

/**
 * Parses a .lvl file (same XML format as the original AndEngine SimpleLevelLoader)
 * into a plain-data level description.
 */
export async function loadLevel(src) {
  const xml = await loadXML(src);
  const levelEl = xml.querySelector('level');
  const width = Number(levelEl.getAttribute('width'));
  const height = Number(levelEl.getAttribute('height'));
  const entities = Array.from(xml.querySelectorAll('entity')).map((el) => ({
    x: Number(el.getAttribute('x')),
    y: Number(el.getAttribute('y')),
    type: el.getAttribute('type'),
  }));
  return { width, height, entities };
}

export const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Aguinaldo',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre', 'Fin De Año',
];
