/**
 * Utilidades puras de la sección "Inmuebles ocupados" (cartera del socio).
 *
 * Aquí vive todo lo que NO toca red: las constantes de dominio (etapas de
 * ocupación, tipos de venta, criterios de orden) y el parseo de los filtros
 * desde/hacia los searchParams de la URL. Se mantiene puro para poder testearlo
 * sin Supabase y para que el estado de los filtros viva en la URL (compartible).
 */

/** Macro-etapas del procedimiento de desocupación, de menos a más avanzado. */
export const OCCUPIED_ETAPAS = [
  'demanda',
  'tramite_previo',
  'sentencia_vista',
  'lanzamiento',
  'adjudicacion_posesion',
  'suspendido_archivo',
  'otros',
  'sin_dato',
] as const

export type OccupiedEtapa = (typeof OCCUPIED_ETAPAS)[number]

export function isOccupiedEtapa(value: string | undefined): value is OccupiedEtapa {
  return OCCUPIED_ETAPAS.includes(value as OccupiedEtapa)
}

/**
 * "Cuán avanzado está el desalojo" — clave para el inversor. Cuanto mayor el
 * número, más cerca de poder disponer del inmueble libre. `suspendido_archivo`
 * es un retroceso (procedimiento parado); `otros`/`sin_dato` no ordenan.
 */
export const ETAPA_ADVANCE: Record<OccupiedEtapa, number> = {
  sin_dato: 0,
  otros: 0,
  suspendido_archivo: 0,
  demanda: 1,
  tramite_previo: 2,
  sentencia_vista: 3,
  lanzamiento: 4,
  adjudicacion_posesion: 5,
}

/**
 * Tono visual del chip de etapa. Reutiliza tokens del design system:
 * verde (success) = más cerca de vacío/entrega, mejor para el inversor;
 * dorado (gold) = fase intermedia; petróleo = en trámite; rojo (error) =
 * procedimiento suspendido/archivado; neutro = sin información.
 */
export type EtapaTone = 'advanced' | 'mid' | 'progress' | 'stalled' | 'neutral'

export const ETAPA_TONE: Record<OccupiedEtapa, EtapaTone> = {
  adjudicacion_posesion: 'advanced',
  lanzamiento: 'advanced',
  sentencia_vista: 'mid',
  tramite_previo: 'progress',
  demanda: 'progress',
  suspendido_archivo: 'stalled',
  otros: 'neutral',
  sin_dato: 'neutral',
}

export const ETAPA_TONE_CLASS: Record<EtapaTone, string> = {
  advanced: 'border-success/30 bg-success/10 text-success',
  mid: 'border-gold-deep/30 bg-gold/15 text-gold-deep',
  progress: 'border-petrol/30 bg-petrol/10 text-petrol-deep',
  stalled: 'border-error/30 bg-error/10 text-error',
  neutral: 'border-hairline bg-paper text-muted',
}

export function etapaToneClass(etapa: OccupiedEtapa): string {
  return ETAPA_TONE_CLASS[ETAPA_TONE[etapa]]
}

/**
 * Los 3 valores literales de `tipo_venta` en la cartera del socio y su clave
 * i18n legible. El valor crudo es lo que se filtra (`.eq`); la etiqueta se
 * traduce. Se declara `readonly` para poder derivar el tipo de las claves.
 */
export const OCCUPIED_TIPO_VENTA = [
  { value: 'Venta Ex-borrowers gest.compar', key: 'exDeudores' },
  { value: 'Venta Okupado gest. compartida', key: 'okupado' },
  { value: 'Venta Ex-tenants gest.compart', key: 'exInquilinos' },
] as const

export type OccupiedTipoVentaKey = (typeof OCCUPIED_TIPO_VENTA)[number]['key']

const TIPO_VENTA_VALUES: readonly string[] = OCCUPIED_TIPO_VENTA.map((t) => t.value)

/** Clave i18n del tipo de venta a partir de su valor crudo (o null si desconocido). */
export function tipoVentaKey(value: string): OccupiedTipoVentaKey | null {
  return OCCUPIED_TIPO_VENTA.find((t) => t.value === value)?.key ?? null
}

/** Criterios de orden permitidos → columna + dirección para Supabase. */
export const OCCUPIED_ORDERS = {
  pvp_asc: { column: 'pvp', ascending: true },
  pvp_desc: { column: 'pvp', ascending: false },
  eur_m2_asc: { column: 'eur_m2', ascending: true },
  eur_m2_desc: { column: 'eur_m2', ascending: false },
  sup_desc: { column: 'superficie_m2', ascending: false },
  sup_asc: { column: 'superficie_m2', ascending: true },
} as const

export type OccupiedOrderKey = keyof typeof OCCUPIED_ORDERS

export const DEFAULT_OCCUPIED_ORDER: OccupiedOrderKey = 'pvp_asc'

export function isOccupiedOrder(value: string | undefined): value is OccupiedOrderKey {
  return value != null && value in OCCUPIED_ORDERS
}

/** Tamaño de página del catálogo. */
export const OCCUPIED_PAGE_SIZE = 24

export interface OccupiedFilters {
  ccaa?: string
  provincia?: string
  municipio?: string
  tipoVenta?: string
  etapa?: OccupiedEtapa
  pvpMin?: number
  pvpMax?: number
  supMin?: number
  supMax?: number
  orderBy: OccupiedOrderKey
}

type RawSearchParams = Record<string, string | string[] | undefined>

/** Primer valor de un parámetro (los arrays llegan cuando ?a=1&a=2). */
function first(value: string | string[] | undefined): string | undefined {
  const v = Array.isArray(value) ? value[0] : value
  const trimmed = v?.trim()
  return trimmed ? trimmed : undefined
}

/** Entero positivo finito, o undefined si no parsea o es negativo. */
function positiveNumber(value: string | undefined): number | undefined {
  if (value === undefined) return undefined
  const n = Number(value.replace(',', '.'))
  return Number.isFinite(n) && n >= 0 ? n : undefined
}

/**
 * Convierte los searchParams crudos en filtros tipados y validados + página.
 * Ignora en silencio cualquier valor inválido (enum fuera de rango, número
 * negativo, orden desconocido) para que una URL manipulada nunca rompa la query.
 */
export function parseOccupiedParams(sp: RawSearchParams): { filters: OccupiedFilters; page: number } {
  const etapaRaw = first(sp.etapa)
  const tipoVentaRaw = first(sp.tipoVenta)
  const orderRaw = first(sp.orderBy)
  const pageRaw = Number(first(sp.page))

  const filters: OccupiedFilters = {
    ccaa: first(sp.ccaa),
    provincia: first(sp.provincia),
    municipio: first(sp.municipio),
    tipoVenta: tipoVentaRaw && TIPO_VENTA_VALUES.includes(tipoVentaRaw) ? tipoVentaRaw : undefined,
    etapa: isOccupiedEtapa(etapaRaw) ? etapaRaw : undefined,
    pvpMin: positiveNumber(first(sp.pvpMin)),
    pvpMax: positiveNumber(first(sp.pvpMax)),
    supMin: positiveNumber(first(sp.supMin)),
    supMax: positiveNumber(first(sp.supMax)),
    orderBy: isOccupiedOrder(orderRaw) ? orderRaw : DEFAULT_OCCUPIED_ORDER,
  }

  const page = Number.isFinite(pageRaw) && pageRaw >= 1 ? Math.floor(pageRaw) : 1
  return { filters, page }
}

/** ¿Hay algún filtro activo (más allá del orden por defecto)? Para el botón "limpiar". */
export function hasActiveFilters(filters: OccupiedFilters): boolean {
  return Boolean(
    filters.ccaa ||
      filters.provincia ||
      filters.municipio ||
      filters.tipoVenta ||
      filters.etapa ||
      filters.pvpMin !== undefined ||
      filters.pvpMax !== undefined ||
      filters.supMin !== undefined ||
      filters.supMax !== undefined,
  )
}

/**
 * Serializa filtros + página a una query string estable (claves ordenadas,
 * el orden por defecto y la página 1 se omiten). Usada por la paginación del
 * server component y por los tests; el cliente construye la suya con URLSearchParams.
 */
export function filtersToSearchParams(filters: OccupiedFilters, page = 1): string {
  const params = new URLSearchParams()
  if (filters.ccaa) params.set('ccaa', filters.ccaa)
  if (filters.provincia) params.set('provincia', filters.provincia)
  if (filters.municipio) params.set('municipio', filters.municipio)
  if (filters.tipoVenta) params.set('tipoVenta', filters.tipoVenta)
  if (filters.etapa) params.set('etapa', filters.etapa)
  if (filters.pvpMin !== undefined) params.set('pvpMin', String(filters.pvpMin))
  if (filters.pvpMax !== undefined) params.set('pvpMax', String(filters.pvpMax))
  if (filters.supMin !== undefined) params.set('supMin', String(filters.supMin))
  if (filters.supMax !== undefined) params.set('supMax', String(filters.supMax))
  if (filters.orderBy !== DEFAULT_OCCUPIED_ORDER) params.set('orderBy', filters.orderBy)
  if (page > 1) params.set('page', String(page))
  return params.toString()
}

/** Nº total de páginas para `total` resultados. */
export function totalPages(total: number): number {
  return Math.max(1, Math.ceil(total / OCCUPIED_PAGE_SIZE))
}
