import type { ValuationRow } from './valuations'

const BOM = '﻿'
const SEPARATOR = ';'
const CRLF = '\r\n'

const KIND_LABELS: Record<string, string> = { piso: 'Piso', casa: 'Casa' }

function formatCell(cell: string | number | null): string {
  if (cell === null) return ''
  const raw = typeof cell === 'number' ? String(cell).replace('.', ',') : cell
  if (raw.includes(SEPARATOR) || raw.includes('"') || raw.includes('\n') || raw.includes('\r')) {
    return `"${raw.replace(/"/g, '""')}"`
  }
  return raw
}

/** Construye CSV es-ES friendly para Excel: separador ';', BOM UTF-8, CRLF. */
export function buildCsv(headers: string[], rows: (string | number | null)[][]): string {
  const lines = [headers.join(SEPARATOR), ...rows.map((row) => row.map(formatCell).join(SEPARATOR))]
  return BOM + lines.join(CRLF) + CRLF
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

const HEADERS = [
  'Fecha',
  'Dirección',
  'Tipo',
  'm² construidos',
  'Valor estimado (€)',
  'Horquilla baja',
  'Horquilla alta',
  '€/m²',
  'Confianza',
  'Estado',
]

/** Vuelca la cartera de valoraciones a CSV para export (agencias). */
export function buildCarteraCsv(rows: ValuationRow[]): string {
  const body = rows.map((row): (string | number | null)[] => {
    const address = row.properties?.address ?? '—'
    const kind = row.properties ? (KIND_LABELS[row.properties.kind] ?? row.properties.kind) : '—'
    const areaM2 = row.properties ? row.properties.built_area_m2 : null

    if (row.outcome.status === 'ok') {
      return [
        formatDate(row.created_at),
        address,
        kind,
        areaM2,
        row.outcome.value,
        row.outcome.low,
        row.outcome.high,
        row.outcome.pricePerM2,
        row.outcome.confidence,
        'valorado',
      ]
    }

    return [
      formatDate(row.created_at),
      address,
      kind,
      areaM2,
      '—',
      '—',
      '—',
      '—',
      '—',
      'rechazado',
    ]
  })

  return buildCsv(HEADERS, body)
}
