/**
 * Helper compartido de los scripts ETL: carga app/.env.local en process.env
 * sin dependencias externas. No pisa variables ya definidas en el entorno.
 */
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

export function loadEnvLocal(): void {
  const envPath = resolve(process.cwd(), '.env.local')
  if (!existsSync(envPath)) return
  for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/)
    if (match && process.env[match[1]] === undefined) {
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, '')
    }
  }
}

/** Lee una variable obligatoria de process.env o aborta con un error claro. */
export function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Falta ${name} en app/.env.local`)
  return value
}
