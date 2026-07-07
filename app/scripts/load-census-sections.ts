/**
 * ETL: cartografía censal INE (seccionado 2023, provincia de Barcelona) → public.census_sections.
 *
 * Uso: npm run etl:secciones   (npm fija el cwd en app/)
 *
 * Fuente (sin GDAL): WFS 2.0 del INE, capa WMS_INE_SECCIONES_G01:Secciones_2023.
 *   - El OGC API Features del INE solo publica el seccionado vigente (2026), pero el WFS
 *     clásico mantiene las capas anuales 2007-2025. Verificado 2026-07-07.
 *   - Alineamiento crítico: renta ADRH 2023 ↔ seccionado 2023 (los CUSEC cambian entre años).
 *   - outputFormat=application/json + srsName=EPSG:4326 → GeoJSON en lon/lat (WGS84).
 *   - cql_filter=CPRO='08' filtra en el servidor: solo provincia de Barcelona (~4.136 secciones).
 *
 * Inserción: Management API de Supabase (POST /v1/projects/{ref}/database/query) con
 * st_geomfromgeojson, en lotes pequeños para no exceder el payload. Idempotente:
 * on conflict (cusec) do nothing.
 *
 * Env: SUPABASE_ACCESS_TOKEN y SUPABASE_PROJECT_REF en app/.env.local.
 */
import { loadEnvLocal, requireEnv } from './env'

const WFS_BASE = 'https://www.ine.es/geoserver/wfs'
const LAYER = 'WMS_INE_SECCIONES_G01:Secciones_2023'
const PROVINCE = '08'
const YEAR = 2023
const PAGE_SIZE = 250 // features por página WFS
const INSERT_BATCH = 40 // features por INSERT (payload del query endpoint)
const MAX_RETRIES = 3

const BROWSER_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
  Accept: 'application/json',
}

interface WfsFeature {
  properties: { CUSEC?: string; CUMUN?: string; CPRO?: string; CSEC?: string }
  geometry: { type: string; coordinates: unknown } | null
}

interface WfsPage {
  features: WfsFeature[]
  numberMatched?: number
  numberReturned?: number
}

interface SectionRow {
  cusec: string
  cumun: string
  geojson: string
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

/** fetch con reintentos y backoff exponencial; detecta HTML de WAF/mantenimiento. */
async function fetchWithRetry(url: string, init: RequestInit, label: string): Promise<string> {
  let lastError: unknown
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(url, init)
      const body = await res.text()
      if (!res.ok) throw new Error(`${label}: HTTP ${res.status} — ${body.slice(0, 300)}`)
      return body
    } catch (error: unknown) {
      lastError = error
      const wait = attempt * 3000
      console.warn(`${label}: intento ${attempt}/${MAX_RETRIES} fallido, reintento en ${wait / 1000}s…`)
      await sleep(wait)
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError))
}

/** Descarga todas las secciones de la provincia paginando el WFS (sortBy=CUSEC → paginación estable). */
async function fetchAllSections(): Promise<SectionRow[]> {
  const rows: SectionRow[] = []
  let startIndex = 0
  let total: number | undefined
  for (;;) {
    const params = new URLSearchParams({
      service: 'WFS',
      version: '2.0.0',
      request: 'GetFeature',
      typeNames: LAYER,
      outputFormat: 'application/json',
      srsName: 'EPSG:4326',
      sortBy: 'CUSEC',
      count: String(PAGE_SIZE),
      startIndex: String(startIndex),
      cql_filter: `CPRO='${PROVINCE}'`,
    })
    const body = await fetchWithRetry(
      `${WFS_BASE}?${params.toString()}`,
      { headers: BROWSER_HEADERS },
      `WFS página startIndex=${startIndex}`,
    )
    if (body.trimStart().startsWith('<')) {
      throw new Error('El WFS del INE devolvió XML/HTML en vez de GeoJSON (¿error del servidor?)')
    }
    const page = JSON.parse(body) as WfsPage
    total ??= page.numberMatched
    for (const feature of page.features) {
      const { CUSEC, CUMUN, CPRO } = feature.properties
      if (CPRO !== PROVINCE || !CUSEC || !/^\d{10}$/.test(CUSEC) || !CUMUN) continue
      // CSEC '000' = polígono agregado (distrito/municipio), no una sección real:
      // solapa con las secciones y rompe el lookup punto→sección. Fuera.
      if (CUSEC.endsWith('000')) continue
      if (feature.geometry === null) continue
      const geojson = JSON.stringify(feature.geometry)
      if (geojson.includes('$json$')) throw new Error(`Geometría sospechosa en ${CUSEC}`) // seguridad dollar-quoting
      rows.push({ cusec: CUSEC, cumun: CUMUN, geojson })
    }
    console.log(`WFS: ${rows.length}/${total ?? '?'} secciones descargadas`)
    if (page.features.length < PAGE_SIZE) break
    startIndex += PAGE_SIZE
  }
  return rows
}

/** Ejecuta SQL vía el query endpoint de la Management API. Devuelve las filas (para selects). */
async function runQuery(sql: string, token: string, ref: string, label: string): Promise<unknown> {
  const body = await fetchWithRetry(
    `https://api.supabase.com/v1/projects/${ref}/database/query`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: sql }),
    },
    label,
  )
  return body === '' ? [] : (JSON.parse(body) as unknown)
}

function buildInsertSql(batch: SectionRow[]): string {
  const values = batch
    .map(
      (r) =>
        `('${r.cusec}','${r.cumun}',${YEAR},st_multi(st_setsrid(st_geomfromgeojson($json$${r.geojson}$json$),4326)))`,
    )
    .join(',\n')
  return `insert into public.census_sections (cusec, cumun, year, geom)\nvalues ${values}\non conflict (cusec) do nothing;`
}

/** Inserta un lote; si falla tras los reintentos y el lote es divisible, lo parte en dos. */
async function insertBatch(batch: SectionRow[], token: string, ref: string): Promise<void> {
  try {
    await runQuery(buildInsertSql(batch), token, ref, `INSERT lote de ${batch.length}`)
  } catch (error: unknown) {
    if (batch.length <= 5) throw error
    console.warn(`Lote de ${batch.length} fallido tras reintentos: lo parto en dos mitades…`)
    const mid = Math.ceil(batch.length / 2)
    await insertBatch(batch.slice(0, mid), token, ref)
    await insertBatch(batch.slice(mid), token, ref)
  }
}

async function main(): Promise<void> {
  loadEnvLocal()
  const token = requireEnv('SUPABASE_ACCESS_TOKEN')
  const ref = requireEnv('SUPABASE_PROJECT_REF')

  console.log(`Descargando seccionado ${YEAR} de la provincia ${PROVINCE} desde el WFS del INE…`)
  const rows = await fetchAllSections()
  console.log(`Total: ${rows.length} secciones con geometría. Insertando en census_sections…`)

  const totalBatches = Math.ceil(rows.length / INSERT_BATCH)
  for (let i = 0; i < rows.length; i += INSERT_BATCH) {
    const batchNumber = i / INSERT_BATCH + 1
    await insertBatch(rows.slice(i, i + INSERT_BATCH), token, ref)
    if (batchNumber % 10 === 0 || batchNumber === totalBatches) {
      console.log(`Lote ${batchNumber}/${totalBatches} insertado (${Math.min(i + INSERT_BATCH, rows.length)} filas)`)
    }
  }

  // Verificación final desde el propio script.
  const count = await runQuery('select count(*)::int as n from public.census_sections;', token, ref, 'Verificación count')
  const raval = await runQuery('select public.census_section_for_point(41.379908, 2.168444) as cusec;', token, ref, 'Lookup Raval')
  const sarria = await runQuery('select public.census_section_for_point(41.3990, 2.1210) as cusec;', token, ref, 'Lookup Sarrià')
  const join = await runQuery(
    'select count(*)::int as n from public.census_sections cs join public.zone_stats z on z.census_section_id = cs.cusec;',
    token,
    ref,
    'Verificación join renta↔geometría',
  )
  console.log('census_sections:', JSON.stringify(count))
  console.log('lookup Raval (41.379908, 2.168444):', JSON.stringify(raval))
  console.log('lookup Sarrià (41.3990, 2.1210):', JSON.stringify(sarria))
  console.log('join zone_stats↔census_sections:', JSON.stringify(join))
  console.log('Carga de cartografía censal completada.')
}

main().catch((e: unknown) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
