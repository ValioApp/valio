/**
 * ETL: INE ADRH tabla 30896 (provincia de Barcelona) → public.zone_stats.
 *
 * Uso:    npm run etl:adrh          (npm fija el cwd en app/ — las rutas dependen de ello)
 * Datos:  lee data/ine/30896.csv (carpeta data/ de la raíz del mundo, gitignorada);
 *         si no existe, lo descarga del INE (~31 MB) y lo guarda ahí.
 * Env:    NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en app/.env.local.
 *         ⚠️ service_role salta el RLS: SOLO scripts de servidor, JAMÁS en el frontend.
 * Idempotente: upsert por census_section_id (no borra filas seed SEED-*).
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { createClient } from '@supabase/supabase-js'
import { buildZoneStats, parseAdrhCsv } from '../src/etl/adrh'
import { loadEnvLocal, requireEnv } from './env'

const CSV_URL = 'https://www.ine.es/jaxiT3/files/t/es/csv_bdsc/30896.csv?nocab=1'
// cwd = app/ (garantizado por npm run): la raíz del mundo es el directorio padre.
const CSV_PATH = resolve(process.cwd(), '../data/ine/30896.csv')
const BATCH_SIZE = 500
const DEFAULT_NEGOTIATION_DISCOUNT = 0.06
// El INE a veces rechaza clientes sin cabeceras de navegador (WAF).
const BROWSER_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
  Accept: 'text/csv,text/plain,*/*',
}

async function readOrDownloadCsv(): Promise<string> {
  if (existsSync(CSV_PATH)) {
    console.log(`CSV local: ${CSV_PATH}`)
    return readFileSync(CSV_PATH, 'utf8')
  }
  console.log(`Descargando ${CSV_URL} (~31 MB)…`)
  let lastError: unknown
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(CSV_URL, { headers: BROWSER_HEADERS })
      if (!res.ok) throw new Error(`Descarga del INE falló: HTTP ${res.status}`)
      const text = await res.text()
      if (text.trimStart().startsWith('<')) {
        throw new Error('El INE devolvió HTML en vez de CSV (WAF/mantenimiento)')
      }
      mkdirSync(dirname(CSV_PATH), { recursive: true })
      writeFileSync(CSV_PATH, text, 'utf8')
      console.log(`Guardado en ${CSV_PATH}`)
      return text
    } catch (error: unknown) {
      lastError = error
      const wait = attempt * 2000
      console.warn(`Intento ${attempt}/3 fallido, reintento en ${wait / 1000}s…`)
      await new Promise((r) => setTimeout(r, wait))
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError))
}

async function main(): Promise<void> {
  loadEnvLocal()
  const url = requireEnv('NEXT_PUBLIC_SUPABASE_URL')
  const serviceKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY')
  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } })

  const data = parseAdrhCsv(await readOrDownloadCsv())
  const rows = buildZoneStats(data.sections, data.municipalities, data.year, DEFAULT_NEGOTIATION_DISCOUNT)
  console.log(
    `ADRH ${data.year}: ${data.sections.size} secciones, ${data.municipalities.size} municipios → ${rows.length} filas zone_stats`,
  )

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE)
    const { error } = await supabase.from('zone_stats').upsert(batch, { onConflict: 'census_section_id' })
    if (error) throw new Error(`Upsert lote ${i / BATCH_SIZE + 1}: ${error.message}`)
    console.log(`Lote ${i / BATCH_SIZE + 1}: ${batch.length} filas`)
  }
  console.log('ETL ADRH completado.')
}

main().catch((e: unknown) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
