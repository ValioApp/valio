import { describe, expect, it } from 'vitest'
import { buildCarteraCsv, buildCsv } from './csv'
import type { ValuationRow } from './valuations'

describe('buildCsv', () => {
  it('empieza con el BOM UTF-8', () => {
    const csv = buildCsv(['a'], [['1']])
    expect(csv.charCodeAt(0)).toBe(0xfeff)
  })

  it('separa columnas con ";" y filas con CRLF', () => {
    const csv = buildCsv(['a', 'b'], [
      ['1', '2'],
      ['3', '4'],
    ])
    const body = csv.slice(1) // sin BOM
    expect(body.split('\r\n')).toEqual(['a;b', '1;2', '3;4', ''])
  })

  it('escapa campos con ";", comillas o saltos de línea entre comillas dobles', () => {
    const csv = buildCsv(['a'], [
      ['contiene;punto y coma'],
      ['con "comillas"'],
      ['con\nsalto'],
    ])
    const lines = csv.slice(1).split('\r\n')
    expect(lines[1]).toBe('"contiene;punto y coma"')
    expect(lines[2]).toBe('"con ""comillas"""')
    expect(lines[3]).toBe('"con\nsalto"')
  })

  it('convierte null a campo vacío', () => {
    const csv = buildCsv(['a', 'b'], [[null, 'x']])
    const lines = csv.slice(1).split('\r\n')
    expect(lines[1]).toBe(';x')
  })

  it('formatea números con coma decimal es-ES y sin separador de miles', () => {
    const csv = buildCsv(['a'], [[1234.5], [10]])
    const lines = csv.slice(1).split('\r\n')
    expect(lines[1]).toBe('1234,5')
    expect(lines[2]).toBe('10')
  })
})

describe('buildCarteraCsv', () => {
  const mkRow = (overrides: Partial<ValuationRow> = {}): ValuationRow => ({
    id: 'v1',
    created_at: '2026-07-07T10:00:00.000Z',
    outcome: {
      status: 'ok',
      value: 196000,
      low: 186000,
      high: 206000,
      pricePerM2: 2800,
      confidence: 'alta',
      fsd: 0.05,
      zoneAdjustmentPct: 0.03,
      comparables: [],
    },
    properties: {
      address: 'Carrer de la Diputació, 250, Barcelona',
      kind: 'piso',
      built_area_m2: 70,
    },
    ...overrides,
  })

  it('genera una fila por valoración con la cabecera esperada', () => {
    const csv = buildCarteraCsv([mkRow()])
    const lines = csv.slice(1).split('\r\n')
    expect(lines[0]).toBe(
      'Fecha;Dirección;Tipo;m² construidos;Valor estimado (€);Horquilla baja;Horquilla alta;€/m²;Confianza;Estado',
    )
    expect(lines[1]).toBe(
      '07/07/2026;Carrer de la Diputació, 250, Barcelona;Piso;70;196000;186000;206000;2800;alta;valorado',
    )
  })

  it('fila rechazada muestra "—" en los valores numéricos y estado "rechazado"', () => {
    const row = mkRow({
      outcome: {
        status: 'rejected',
        reason: 'insufficient_comparables',
        found: 3,
        required: 6,
      },
    })
    const csv = buildCarteraCsv([row])
    const line = csv.slice(1).split('\r\n')[1]
    const cells = line.split(';')
    // Fecha;Dirección;Tipo;m²;Valor;Baja;Alta;€/m²;Confianza;Estado
    expect(cells[4]).toBe('—')
    expect(cells[5]).toBe('—')
    expect(cells[6]).toBe('—')
    expect(cells[7]).toBe('—')
    expect(cells[8]).toBe('—')
    expect(cells[9]).toBe('rechazado')
  })
})
