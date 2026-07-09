import type { SupabaseClient } from '@supabase/supabase-js'
import {
  OCCUPIED_ORDERS,
  OCCUPIED_PAGE_SIZE,
  type OccupiedEtapa,
  type OccupiedFilters,
} from '@/lib/occupied'

/**
 * Capa de datos de "Inmuebles ocupados" (tabla global `occupied_properties`,
 * RLS de lectura para autenticados). Es la primera sección del catálogo del
 * socio; el mapeo snake_case→camelCase se aísla aquí para que las páginas
 * consuman un tipo limpio y las futuras secciones (alquiler, compra) sigan el
 * mismo patrón.
 */
export interface OccupiedProperty {
  id: string
  tipoVenta: string
  ccaa: string
  provincia: string
  municipio: string
  direccion: string
  cp: string
  refCatastral: string | null
  fincaRegistral: string | null
  dormitorios: number | null
  banos: number | null
  superficieM2: number | null
  pvp: number | null
  eurM2: number | null
  ocupacionFaseRaw: string | null
  ocupacionEtapa: OccupiedEtapa
  link: string
  lat: number | null
  lon: number | null
}

interface OccupiedRow {
  id: string
  tipo_venta: string
  ccaa: string
  provincia: string
  municipio: string
  direccion: string
  cp: string
  ref_catastral: string | null
  finca_registral: string | null
  dormitorios: number | null
  banos: number | null
  superficie_m2: number | string | null
  pvp: number | string | null
  eur_m2: number | string | null
  ocupacion_fase_raw: string | null
  ocupacion_etapa: string | null
  link: string
  lat: number | null
  lon: number | null
}

const TABLE = 'occupied_properties'
const COLUMNS =
  'id, tipo_venta, ccaa, provincia, municipio, direccion, cp, ref_catastral, finca_registral, dormitorios, banos, superficie_m2, pvp, eur_m2, ocupacion_fase_raw, ocupacion_etapa, link, lat, lon'

/** numeric de Postgres llega como string por PostgREST; normalizamos a number|null. */
function num(value: number | string | null): number | null {
  if (value === null) return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function mapRow(r: OccupiedRow): OccupiedProperty {
  return {
    id: r.id,
    tipoVenta: r.tipo_venta,
    ccaa: r.ccaa,
    provincia: r.provincia,
    municipio: r.municipio,
    direccion: r.direccion,
    cp: r.cp,
    refCatastral: r.ref_catastral,
    fincaRegistral: r.finca_registral,
    dormitorios: r.dormitorios,
    banos: r.banos,
    superficieM2: num(r.superficie_m2),
    pvp: num(r.pvp),
    eurM2: num(r.eur_m2),
    ocupacionFaseRaw: r.ocupacion_fase_raw,
    ocupacionEtapa: (r.ocupacion_etapa ?? 'sin_dato') as OccupiedEtapa,
    link: r.link,
    lat: r.lat,
    lon: r.lon,
  }
}

export interface OccupiedListResult {
  rows: OccupiedProperty[]
  total: number
}

/**
 * Catálogo paginado con filtros server-side. `count: 'exact'` para mostrar el
 * total real ("989 inmuebles") y `nullsFirst: false` para no arrancar el orden
 * por precio con las filas sin PVP.
 */
export async function listOccupied(
  supabase: SupabaseClient,
  filters: OccupiedFilters,
  page: number,
): Promise<OccupiedListResult> {
  let query = supabase.from(TABLE).select(COLUMNS, { count: 'exact' })

  if (filters.ccaa) query = query.eq('ccaa', filters.ccaa)
  if (filters.provincia) query = query.eq('provincia', filters.provincia)
  if (filters.municipio) query = query.ilike('municipio', `%${filters.municipio}%`)
  if (filters.tipoVenta) query = query.eq('tipo_venta', filters.tipoVenta)
  if (filters.etapa) query = query.eq('ocupacion_etapa', filters.etapa)
  if (filters.pvpMin !== undefined) query = query.gte('pvp', filters.pvpMin)
  if (filters.pvpMax !== undefined) query = query.lte('pvp', filters.pvpMax)
  if (filters.supMin !== undefined) query = query.gte('superficie_m2', filters.supMin)
  if (filters.supMax !== undefined) query = query.lte('superficie_m2', filters.supMax)

  const order = OCCUPIED_ORDERS[filters.orderBy]
  query = query.order(order.column, { ascending: order.ascending, nullsFirst: false })

  const fromIdx = (page - 1) * OCCUPIED_PAGE_SIZE
  query = query.range(fromIdx, fromIdx + OCCUPIED_PAGE_SIZE - 1)

  const { data, error, count } = await query
  if (error) throw new Error(`listOccupied: ${error.message}`)
  return { rows: ((data ?? []) as unknown as OccupiedRow[]).map(mapRow), total: count ?? 0 }
}

/** Ficha por id, o null si no existe / no visible por RLS. */
export async function getOccupied(
  supabase: SupabaseClient,
  id: string,
): Promise<OccupiedProperty | null> {
  const { data, error } = await supabase.from(TABLE).select(COLUMNS).eq('id', id).maybeSingle()
  if (error) throw new Error(`getOccupied: ${error.message}`)
  return data ? mapRow(data as unknown as OccupiedRow) : null
}

export interface OccupiedFacetItem {
  name: string
  count: number
}

export interface OccupiedFacets {
  /** CCAA con conteo, de mayor a menor. */
  ccaas: OccupiedFacetItem[]
  /** Provincias agrupadas por CCAA (para el select dependiente). */
  provinciasByCcaa: Record<string, OccupiedFacetItem[]>
}

/**
 * Listas para poblar los selects de filtro. Sin RPC: se leen solo las dos
 * columnas y se agregan en memoria. La cartera es un conjunto estático del socio
 * (989 filas), muy por debajo del límite de filas de PostgREST, así que una
 * lectura de 2 columnas es barata; si creciera, esto migraría a una RPC agregada.
 */
export async function occupiedFacets(supabase: SupabaseClient): Promise<OccupiedFacets> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('ccaa, provincia')
    .order('ccaa')
    .limit(5000)
  if (error) throw new Error(`occupiedFacets: ${error.message}`)

  const ccaaCounts = new Map<string, number>()
  const provCounts = new Map<string, Map<string, number>>()

  for (const row of (data ?? []) as { ccaa: string; provincia: string }[]) {
    ccaaCounts.set(row.ccaa, (ccaaCounts.get(row.ccaa) ?? 0) + 1)
    if (!provCounts.has(row.ccaa)) provCounts.set(row.ccaa, new Map())
    const provMap = provCounts.get(row.ccaa)!
    provMap.set(row.provincia, (provMap.get(row.provincia) ?? 0) + 1)
  }

  const ccaas: OccupiedFacetItem[] = [...ccaaCounts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'es'))

  const provinciasByCcaa: Record<string, OccupiedFacetItem[]> = {}
  for (const [ccaa, provMap] of provCounts.entries()) {
    provinciasByCcaa[ccaa] = [...provMap.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'es'))
  }

  return { ccaas, provinciasByCcaa }
}
