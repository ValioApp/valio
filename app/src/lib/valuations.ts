import type { createClient } from '@/lib/supabase/server'
import type { ValuationOutcome } from '@/engine/types'

type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>

/** Fila de valoración con su inmueble (la RLS filtra por workspace). */
export interface ValuationRow {
  id: string
  outcome: ValuationOutcome
  created_at: string
  properties: {
    address: string
    kind: string
    built_area_m2: number
  } | null
}

/** Últimas 50 valoraciones del workspace, más recientes primero. */
export async function fetchRecentValuations(supabase: ServerSupabaseClient): Promise<ValuationRow[]> {
  const { data, error } = await supabase
    .from('valuations')
    .select('id, outcome, created_at, properties(address, kind, built_area_m2)')
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) throw new Error(`No se pudieron cargar las valoraciones: ${error.message}`)
  return (data ?? []) as unknown as ValuationRow[]
}
