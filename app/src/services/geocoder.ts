/**
 * Cliente del geocodificador CartoCiudad (IGN). Sin API key, uso libre.
 * Endpoints verificados 2026-07-07:
 *   GET https://www.cartociudad.es/geocoder/api/geocoder/candidates?q=…&limit=N
 *   GET https://www.cartociudad.es/geocoder/api/geocoder/find?q=…  (o ?id=…&type=…)
 * El payload trae lat/lng (WGS84), muniCode (código INE del municipio) y
 * refCatastral (14 chars = finca del Catastro).
 * Trampa: los apóstrofos llegan como comilla doble (L"HOSPITAL → L'HOSPITAL).
 */

const BASE_URL = 'https://www.cartociudad.es/geocoder/api/geocoder'

/** Subconjunto estructural de fetch, inyectable en tests. */
export type FetchLike = (url: string) => Promise<{
  ok: boolean
  status: number
  text: () => Promise<string>
}>

export interface GeocodeCandidate {
  id: string
  type: string
  address: string
  muni: string
  muniCode: string
  province: string
  postalCode: string | null
  lat: number | null
  lng: number | null
}

export interface GeocodeResult {
  address: string
  muni: string
  muniCode: string
  province: string
  postalCode: string | null
  lat: number
  lng: number
  /** 14 primeros chars (finca) o null si CartoCiudad no la aporta */
  refCatastral: string | null
  state: number
  type: string
}

/** CartoCiudad codifica el apóstrofo como comilla doble. */
export function normalizeCartoAddress(address: string): string {
  return address.replace(/"/g, "'")
}

interface RawCarto {
  id?: string
  type?: string
  address?: string
  muni?: string
  muniCode?: string
  province?: string
  postalCode?: string | null
  lat?: number | null
  lng?: number | null
  refCatastral?: string | null
  state?: number
}

async function fetchJson(url: string, fetchImpl: FetchLike): Promise<unknown> {
  const res = await fetchImpl(url)
  const body = await res.text()
  if (body.trim().startsWith('<')) {
    throw new Error('CartoCiudad devolvió HTML en vez de JSON (WAF o mantenimiento): reintentar más tarde')
  }
  if (!res.ok) throw new Error(`CartoCiudad HTTP ${res.status}`)
  return JSON.parse(body) as unknown
}

export async function searchCandidates(
  q: string,
  limit = 5,
  fetchImpl: FetchLike = fetch,
): Promise<GeocodeCandidate[]> {
  const url = `${BASE_URL}/candidates?q=${encodeURIComponent(q)}&limit=${limit}`
  const payload = await fetchJson(url, fetchImpl)
  if (!Array.isArray(payload)) throw new Error('CartoCiudad candidates: se esperaba un array')
  return (payload as RawCarto[]).map((c) => ({
    id: c.id ?? '',
    type: c.type ?? '',
    address: normalizeCartoAddress(c.address ?? ''),
    muni: c.muni ?? '',
    muniCode: c.muniCode ?? '',
    province: c.province ?? '',
    postalCode: c.postalCode ?? null,
    lat: typeof c.lat === 'number' ? c.lat : null,
    lng: typeof c.lng === 'number' ? c.lng : null,
  }))
}

export type FindQuery = { q: string } | { id: string; type: string }

export async function findAddress(query: FindQuery, fetchImpl: FetchLike = fetch): Promise<GeocodeResult> {
  const params =
    'q' in query
      ? `q=${encodeURIComponent(query.q)}`
      : `id=${encodeURIComponent(query.id)}&type=${encodeURIComponent(query.type)}`
  const raw = (await fetchJson(`${BASE_URL}/find?${params}`, fetchImpl)) as RawCarto | null
  if (raw === null || typeof raw.lat !== 'number' || typeof raw.lng !== 'number') {
    throw new Error('CartoCiudad no pudo geolocalizar la dirección')
  }
  const refCatastral =
    typeof raw.refCatastral === 'string' && raw.refCatastral.length >= 14
      ? raw.refCatastral.slice(0, 14)
      : null
  return {
    address: normalizeCartoAddress(raw.address ?? ''),
    muni: raw.muni ?? '',
    muniCode: raw.muniCode ?? '',
    province: raw.province ?? '',
    postalCode: raw.postalCode ?? null,
    lat: raw.lat,
    lng: raw.lng,
    refCatastral,
    state: raw.state ?? 0,
    type: raw.type ?? '',
  }
}
