/**
 * Normaliza nombres geográficos del INE a su forma natural de lectura.
 *
 * El INE guarda el artículo/descriptor al final:
 *  - Provincias/CCAA: "Palmas, Las", "Coruña, A", "Rioja, La", "Balears, Illes",
 *    "Murcia, Región de", "Madrid, Comunidad de", "Asturias, Principado de".
 *  - Municipios (en mayúsculas): "PALMAS DE GRAN CANARIA (LAS)",
 *    "HOSPITALET DE LLOBREGAT (L')", "MAIRENA DEL ALCOR".
 *
 * `formatProvincia`/`formatCCAA` reordenan el sufijo tras la coma manteniendo el
 * caso. `formatMunicipio` reordena el artículo entre paréntesis y aplica
 * título en español/catalán (conectores en minúscula, apóstrofo catalán l'/d').
 */

/** "Palmas, Las" → "Las Palmas" · "Murcia, Región de" → "Región de Murcia". */
export function formatProvincia(raw: string): string {
  const s = (raw ?? '').trim()
  const i = s.lastIndexOf(', ')
  if (i === -1) return s
  const head = s.slice(0, i)
  const tail = s.slice(i + 2).trim()
  // Solo reordena si el sufijo es un artículo/descriptor (empieza en mayúscula,
  // sin dígitos): evita partir topónimos con coma legítima.
  if (!tail || /\d/.test(tail)) return s
  return `${tail} ${head}`
}

export const formatCCAA = formatProvincia

const LOWER = new Set([
  'de', 'del', 'la', 'las', 'los', 'el', 'y', 'e', 'i', 'o', 'u', 'a',
  'con', 'en', 'per', 'als', 'als', 'dels', 'ses', 'es', 'sa', 'ses',
])

/** Título respetando conectores en minúscula y apóstrofo catalán (l'/d'). */
function toTitle(raw: string): string {
  const words = raw.toLowerCase().split(/\s+/).filter(Boolean)
  return words
    .map((w, idx) => {
      // apóstrofo catalán: l'hospitalet → L'Hospitalet, d'en → d'En (raro)
      const ap = w.match(/^([ld])'(.+)$/i)
      if (ap) {
        const art = ap[1].toLowerCase()
        const rest = ap[2]
        const restCap = rest.charAt(0).toUpperCase() + rest.slice(1)
        // el artículo l'/d' va en mayúscula si abre el nombre
        return `${idx === 0 ? art.toUpperCase() : art}'${restCap}`
      }
      if (idx !== 0 && LOWER.has(w)) return w
      return w.charAt(0).toUpperCase() + w.slice(1)
    })
    .join(' ')
}

/**
 * "PALMAS DE GRAN CANARIA (LAS)" → "Las Palmas de Gran Canaria"
 * "HOSPITALET DE LLOBREGAT (L')" → "L'Hospitalet de Llobregat"
 * "MAIRENA DEL ALCOR" → "Mairena del Alcor"
 */
export function formatMunicipio(raw: string): string {
  let s = (raw ?? '').trim()
  const paren = s.match(/^(.*?)\s*\(([^)]+)\)\s*$/)
  if (paren) {
    const body = paren[1].trim()
    const art = paren[2].trim()
    // L' / D' se pega sin espacio; el resto lleva espacio
    s = /['´’]$/.test(art) ? `${art}${body}` : `${art} ${body}`
  }
  return toTitle(s)
}
