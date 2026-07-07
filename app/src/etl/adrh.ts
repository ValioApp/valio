/**
 * Parser del CSV del Atlas de Distribución de Renta de los Hogares (INE).
 * Tabla 30896 = provincia de Barcelona. Formato verificado 2026-07-07:
 *   Municipios;Distritos;Secciones;Indicadores de renta media y mediana;Periodo;Total
 *   08001 Abrera;;;Renta neta media por persona;2023;16.682            ← fila de MUNICIPIO
 *   08001 Abrera;0800101 Abrera distrito 01;;…;2023;16.682             ← fila de distrito (se ignora)
 *   08001 Abrera;…;0800101001 Abrera sección 01001;…;2023;16.065       ← fila de SECCIÓN
 * Trampas: BOM inicial; el punto es separador de MILES (16.065 → 16065 €);
 * secreto estadístico = Total vacío o '.' (fila omitida).
 */

const TARGET_INDICATOR = 'Renta neta media por persona'

export interface AdrhData {
  /** CUSEC (10 dígitos) → renta neta media por persona, € enteros */
  sections: Map<string, number>
  /** CUMUN (5 dígitos) → renta neta media por persona, € enteros */
  municipalities: Map<string, number>
  /** Periodo más reciente presente en el CSV */
  year: number
}

/** '16.065' → 16065. Vacío o '.' (secreto estadístico) → null. */
export function parseAdrhIncome(raw: string): number | null {
  const clean = raw.trim()
  if (clean === '' || clean === '.') return null
  const value = Number(clean.replace(/\./g, ''))
  return Number.isInteger(value) && value > 0 ? value : null
}

export function parseAdrhCsv(text: string): AdrhData {
  const lines = text.replace(/^﻿/, '').split(/\r?\n/)
  const rows: { muni: string; district: string; section: string; period: number; total: string }[] = []
  for (const line of lines.slice(1)) {
    if (line.trim() === '') continue
    const cols = line.split(';')
    if (cols.length < 6) continue
    const [muni, district, section, indicator, period, total] = cols
    if (indicator !== TARGET_INDICATOR) continue
    rows.push({ muni, district, section, period: Number(period), total })
  }
  if (rows.length === 0) throw new Error(`CSV ADRH sin filas del indicador "${TARGET_INDICATOR}"`)

  const year = Math.max(...rows.map((r) => r.period))
  const sections = new Map<string, number>()
  const municipalities = new Map<string, number>()
  for (const row of rows) {
    if (row.period !== year) continue
    const income = parseAdrhIncome(row.total)
    if (income === null) continue // secreto estadístico
    if (row.section !== '') {
      sections.set(row.section.slice(0, 10), income)
    } else if (row.district === '') {
      municipalities.set(row.muni.slice(0, 5), income)
    }
    // Filas de distrito (district !== '' && section === ''): granularidad que no usamos.
  }
  return { sections, municipalities, year }
}

/** Fila lista para upsert en public.zone_stats (snake_case = columnas de la DB). */
export interface ZoneStatsRow {
  census_section_id: string
  municipality_code: string
  net_income_per_capita: number
  municipality_income_per_capita: number
  income_coef: number
  negotiation_discount: number
  income_year: number
}

export function buildZoneStats(
  sections: Map<string, number>,
  municipalities: Map<string, number>,
  year: number,
  defaultNegotiationDiscount: number,
): ZoneStatsRow[] {
  const rows: ZoneStatsRow[] = []
  for (const [cusec, income] of sections) {
    const cumun = cusec.slice(0, 5)
    const muniIncome = municipalities.get(cumun)
    if (muniIncome === undefined) continue // municipio bajo secreto estadístico
    rows.push({
      census_section_id: cusec,
      municipality_code: cumun,
      net_income_per_capita: income,
      municipality_income_per_capita: muniIncome,
      income_coef: Number((income / muniIncome).toFixed(4)),
      negotiation_discount: defaultNegotiationDiscount,
      income_year: year,
    })
  }
  return rows
}
