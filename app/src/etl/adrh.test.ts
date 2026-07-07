import { describe, expect, it } from 'vitest'
import { buildZoneStats, parseAdrhCsv, parseAdrhIncome } from './adrh'

// Líneas REALES de https://www.ine.es/jaxiT3/files/t/es/csv_bdsc/30896.csv?nocab=1
// (verificado 2026-07-07). El CSV real empieza con BOM — el fixture también.
const FIXTURE =
  '﻿' + // BOM real: el CSV del INE llega en UTF-8 con BOM
  [
    'Municipios;Distritos;Secciones;Indicadores de renta media y mediana;Periodo;Total',
    '08001 Abrera;;;Renta neta media por persona;2023;16.682',
    '08001 Abrera;;;Renta neta media por persona;2022;15.746',
    '08001 Abrera;;;Renta neta media por hogar;2023;45.010',
    '08001 Abrera;0800101 Abrera distrito 01;;Renta neta media por persona;2023;16.682',
    '08001 Abrera;0800101 Abrera distrito 01;0800101001 Abrera sección 01001;Renta neta media por persona;2023;16.065',
    '08001 Abrera;0800101 Abrera distrito 01;0800101002 Abrera sección 01002;Renta neta media por persona;2023;15.216',
    '08019 Barcelona;;;Renta neta media por persona;2023;19.527',
    '08019 Barcelona;0801901 Barcelona distrito 01;0801901001 Barcelona sección 01001;Renta neta media por persona;2023;13.122',
    '08021 Bellprat;;;Renta neta media por persona;2023;.',
    '08021 Bellprat;0802101 Bellprat distrito 01;0802101001 Bellprat sección 01001;Renta neta media por persona;2023;.',
    '',
  ].join('\n')

describe('parseAdrhIncome', () => {
  it('interpreta el punto como separador de miles', () => {
    expect(parseAdrhIncome('16.065')).toBe(16065)
    expect(parseAdrhIncome('19.527')).toBe(19527)
  })

  it('devuelve null para el secreto estadístico (vacío o punto)', () => {
    expect(parseAdrhIncome('')).toBeNull()
    expect(parseAdrhIncome('.')).toBeNull()
  })
})

describe('parseAdrhCsv', () => {
  const data = parseAdrhCsv(FIXTURE)

  it('detecta el periodo más reciente presente', () => {
    expect(data.year).toBe(2023)
  })

  it('extrae secciones con CUSEC de 10 dígitos y renta en euros enteros', () => {
    expect(data.sections.get('0800101001')).toBe(16065)
    expect(data.sections.get('0800101002')).toBe(15216)
    expect(data.sections.get('0801901001')).toBe(13122)
  })

  it('extrae municipios con CUMUN de 5 dígitos', () => {
    expect(data.municipalities.get('08001')).toBe(16682)
    expect(data.municipalities.get('08019')).toBe(19527)
  })

  it('ignora filas de distrito, otros indicadores y otros periodos', () => {
    // Solo las 3 secciones y los 2 municipios de arriba: ni distritos,
    // ni "Renta neta media por hogar", ni el periodo 2022.
    expect(data.sections.size).toBe(3)
    expect(data.municipalities.size).toBe(2)
  })

  it('omite filas bajo secreto estadístico', () => {
    expect(data.sections.has('0802101001')).toBe(false)
    expect(data.municipalities.has('08021')).toBe(false)
  })
})

describe('buildZoneStats', () => {
  const data = parseAdrhCsv(FIXTURE)
  const rows = buildZoneStats(data.sections, data.municipalities, data.year, 0.06)

  it('calcula income_coef = renta sección / renta municipio (4 decimales)', () => {
    const abrera = rows.find((r) => r.census_section_id === '0800101001')
    expect(abrera).toMatchObject({
      census_section_id: '0800101001',
      municipality_code: '08001',
      net_income_per_capita: 16065,
      municipality_income_per_capita: 16682,
      income_coef: 0.963, // 16065 / 16682 = 0.9630…
      negotiation_discount: 0.06,
      income_year: 2023,
    })
    const raval = rows.find((r) => r.census_section_id === '0801901001')
    expect(raval?.income_coef).toBe(0.672) // 13122 / 19527 = 0.6720 → Raval por debajo de la media de BCN
  })

  it('genera una fila por sección con renta', () => {
    expect(rows).toHaveLength(3)
  })
})
