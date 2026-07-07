import type { SupabaseClient } from '@supabase/supabase-js'
import type { Comparable, PropertyKind, ZoneStats } from '@/engine/types'

interface ComparableRow {
  id: string
  kind: PropertyKind
  price: number
  is_closing_price: boolean
  built_area_m2: number
  bedrooms: number | null
  floor: number | null
  has_elevator: boolean | null
  year_built: number | null
  condition: Comparable['condition']
  occupancy: Comparable['occupancy']
  lat: number
  lon: number
  census_section_id: string
  observed_at: string
  source: string
  distance_m: number
}

export async function fetchCandidates(
  supabase: SupabaseClient,
  params: { lat: number; lon: number; radiusM: number; kind: PropertyKind },
): Promise<Comparable[]> {
  const { data, error } = await supabase.rpc('comparables_within', {
    p_lat: params.lat,
    p_lon: params.lon,
    p_radius_m: params.radiusM,
    p_kind: params.kind,
  })
  if (error) throw new Error(`comparables_within: ${error.message}`)
  return ((data ?? []) as ComparableRow[]).map((r) => ({
    id: r.id,
    kind: r.kind,
    price: Number(r.price),
    isClosingPrice: r.is_closing_price,
    builtAreaM2: Number(r.built_area_m2),
    bedrooms: r.bedrooms,
    floor: r.floor,
    hasElevator: r.has_elevator,
    yearBuilt: r.year_built,
    condition: r.condition,
    occupancy: r.occupancy,
    lat: r.lat,
    lon: r.lon,
    censusSectionId: r.census_section_id,
    observedAt: r.observed_at,
    source: r.source,
    distanceM: Number(r.distance_m),
  }))
}

/**
 * Carga SOLO las zonas implicadas (subject + testigos). Nunca la tabla entera:
 * con miles de secciones censales cargadas, PostgREST corta en 1.000 filas y el
 * motor perdería zonas en silencio (bug real cazado en el smoke E2E 2026-07-07).
 */
export async function fetchZoneStats(
  supabase: SupabaseClient,
  sectionIds: string[],
): Promise<Map<string, ZoneStats>> {
  if (sectionIds.length === 0) return new Map()
  const { data, error } = await supabase
    .from('zone_stats')
    .select('*')
    .in('census_section_id', [...new Set(sectionIds)])
  if (error) throw new Error(`zone_stats: ${error.message}`)
  return new Map(
    (data ?? []).map((z) => [
      z.census_section_id as string,
      {
        censusSectionId: z.census_section_id,
        municipalityCode: z.municipality_code,
        netIncomePerCapita: Number(z.net_income_per_capita),
        municipalityIncomePerCapita: Number(z.municipality_income_per_capita),
        incomeCoef: Number(z.income_coef),
        negotiationDiscount: Number(z.negotiation_discount),
      } satisfies ZoneStats,
    ]),
  )
}
