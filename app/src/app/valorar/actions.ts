'use server'

import { z } from 'zod'
import { fetchCandidates, fetchZoneStats } from '@/data/comparables'
import { valuate } from '@/engine/valuate'
import type { SubjectProperty, ValuationOutcome } from '@/engine/types'
import { createClient } from '@/lib/supabase/server'

const schema = z.object({
  kind: z.enum(['piso', 'casa']),
  builtAreaM2: z.coerce.number().min(15).max(2000),
  bedrooms: z.coerce.number().int().min(0).max(20),
  floor: z.coerce.number().int().min(0).max(40).nullable(),
  hasElevator: z.coerce.boolean(),
  yearBuilt: z.coerce.number().int().min(1800).max(2026).nullable(),
  condition: z.enum(['a_reformar', 'buen_estado', 'reformado', 'obra_nueva']),
  occupancy: z.enum(['libre', 'alquilado', 'ocupado']),
  lat: z.coerce.number().min(35).max(44),
  lon: z.coerce.number().min(-10).max(5),
  censusSectionId: z.string().min(1),
})

export type ValuationFormState =
  | { status: 'idle' }
  | { status: 'error'; message: string }
  | { status: 'done'; outcome: ValuationOutcome }

export async function runValuation(
  _prev: ValuationFormState,
  formData: FormData,
): Promise<ValuationFormState> {
  const raw = Object.fromEntries(formData.entries())
  const parsed = schema.safeParse({
    ...raw,
    floor: raw.floor === '' ? null : raw.floor,
    yearBuilt: raw.yearBuilt === '' ? null : raw.yearBuilt,
    hasElevator: raw.hasElevator === 'on',
  })
  if (!parsed.success) {
    return { status: 'error', message: parsed.error.issues[0].message }
  }

  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return { status: 'error', message: 'Inicia sesión para valorar.' }

  const subject: SubjectProperty = parsed.data
  try {
    const [candidates, zones] = await Promise.all([
      fetchCandidates(supabase, { lat: subject.lat, lon: subject.lon, radiusM: 1500, kind: subject.kind }),
      fetchZoneStats(supabase),
    ])
    const outcome = valuate(subject, candidates, zones, new Date())
    return { status: 'done', outcome }
  } catch (e) {
    return { status: 'error', message: e instanceof Error ? e.message : 'Error inesperado' }
  }
}
