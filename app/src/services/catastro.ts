/**
 * Cliente del servicio libre Consulta_DNPRC del Catastro (OVC). Sin API key.
 * Endpoint JSON verificado 2026-07-07 (doc oficial "Servicios web libres de la SEC" v2.6):
 *   GET https://ovc.catastro.meh.es/OVCServWeb/OVCWcfCallejero/COVCCallejero.svc/json/Consulta_DNPRC?Provincia=&Municipio=&RefCat=<RC>
 * Con RC de 14 chars (finca) devuelve consulta_dnprcResult.lrcdnp.rcdnp[] — lista de
 * inmuebles, cada uno con debi { luso, sfc, cpt, ant }.
 * Trampas: los errores llegan con HTTP 200 (control.cuerr + lerr[]); en mantenimiento
 * puede devolver HTML con status 200 → si el body empieza por '<', es error.
 */
import type { FetchLike } from './geocoder'

const DNPRC_URL =
  'https://ovc.catastro.meh.es/OVCServWeb/OVCWcfCallejero/COVCCallejero.svc/json/Consulta_DNPRC'

export interface CatastroProperty {
  /** Referencia catastral de la finca (14 chars, mayúsculas) */
  refCat: string
  /** luso del inmueble elegido: 'Residencial', 'Comercial', … */
  usage: string
  builtAreaM2: number
  yearBuilt: number | null
}

interface CatastroDebi {
  luso?: string
  sfc?: string
  ant?: string
}

interface CatastroRcdnp {
  debi?: CatastroDebi
}

interface CatastroResult {
  control?: { cudnp?: number; cuerr?: number }
  lerr?: { cod?: string; des?: string }[]
  lrcdnp?: { rcdnp?: CatastroRcdnp | CatastroRcdnp[] }
  bico?: { bi?: { debi?: CatastroDebi } }
}

function toInt(raw: string | undefined): number | null {
  if (raw === undefined) return null
  const value = Number.parseInt(raw, 10)
  return Number.isFinite(value) ? value : null
}

/**
 * Criterio de selección (decisión documentada): entre los inmuebles de la finca,
 * el RESIDENCIAL de mayor superficie; si no hay residenciales, el de mayor superficie.
 * Por qué: VALIO valora residencial, y con la RC de 14 chars de un portal en división
 * horizontal el Catastro devuelve TODOS los inmuebles (locales incluidos). El prefill
 * es orientativo y el usuario puede editarlo en el formulario.
 */
function pickUnit(units: CatastroDebi[]): CatastroDebi | null {
  const withArea = units.filter((u) => toInt(u.sfc) !== null)
  if (withArea.length === 0) return null
  const residential = withArea.filter((u) => u.luso === 'Residencial')
  const pool = residential.length > 0 ? residential : withArea
  return pool.reduce((best, u) => ((toInt(u.sfc) ?? 0) > (toInt(best.sfc) ?? 0) ? u : best))
}

export async function consultaDNPRC(
  refCat14: string,
  fetchImpl: FetchLike = fetch,
): Promise<CatastroProperty> {
  if (!/^[A-Za-z0-9]{14}$/.test(refCat14)) {
    throw new Error(`Referencia catastral inválida (se esperan 14 caracteres): ${refCat14}`)
  }
  const url = `${DNPRC_URL}?Provincia=&Municipio=&RefCat=${encodeURIComponent(refCat14)}`
  const res = await fetchImpl(url)
  const body = await res.text()
  if (body.trim().startsWith('<')) {
    throw new Error('El Catastro devolvió HTML con status 200 (mantenimiento o error): reintentar más tarde')
  }
  if (!res.ok) throw new Error(`Catastro HTTP ${res.status}`)

  const parsed = JSON.parse(body) as { consulta_dnprcResult?: CatastroResult }
  const result = parsed.consulta_dnprcResult
  if (!result) throw new Error('Catastro: respuesta sin consulta_dnprcResult')
  if (result.control?.cuerr) {
    throw new Error(`Catastro: ${result.lerr?.[0]?.des ?? 'error desconocido'}`)
  }

  const rawList = result.lrcdnp?.rcdnp ?? (result.bico?.bi ? [result.bico.bi] : [])
  const units = (Array.isArray(rawList) ? rawList : [rawList])
    .map((r) => r.debi)
    .filter((d): d is CatastroDebi => d !== undefined)
  const unit = pickUnit(units)
  if (unit === null) throw new Error('Catastro: la finca no tiene inmuebles con superficie')

  const builtAreaM2 = toInt(unit.sfc)
  if (builtAreaM2 === null) throw new Error('Catastro: inmueble sin superficie')

  return {
    refCat: refCat14.toUpperCase(),
    usage: unit.luso ?? 'Desconocido',
    builtAreaM2,
    yearBuilt: toInt(unit.ant),
  }
}
