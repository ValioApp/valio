'use server'

import { z } from 'zod'
import { fetchCandidates, fetchZoneStats } from '@/data/comparables'
import { valuate } from '@/engine/valuate'
import type { SubjectProperty, ValuationOutcome } from '@/engine/types'
import { createClient } from '@/lib/supabase/server'

const schema = z.object({
  kind: z.enum(['piso', 'casa']),
  // Dirección real resuelta por CartoCiudad (hidden input); opcional para no romper
  // /demo ni submits legacy → fallback al persistir.
  address: z.string().optional(),
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
  | { status: 'done'; outcome: ValuationOutcome; propertyId: string | null }

export async function runValuation(
  _prev: ValuationFormState,
  formData: FormData,
): Promise<ValuationFormState> {
  const raw = Object.fromEntries(formData.entries())
  const parsed = schema.safeParse({
    ...raw,
    address: raw.address === '' ? undefined : raw.address,
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
    const candidates = await fetchCandidates(supabase, {
      lat: subject.lat,
      lon: subject.lon,
      radiusM: 1500,
      kind: subject.kind,
    })
    // Solo las zonas implicadas: subject + secciones de los testigos encontrados.
    const zones = await fetchZoneStats(supabase, [
      subject.censusSectionId,
      ...candidates.map((c) => c.censusSectionId),
    ])
    const outcome = valuate(subject, candidates, zones, new Date())

    // Persistencia (snapshot reproducible). El workspace lo resuelve la RLS.
    // Si falla, la valoración se muestra igual pero queda rastro en el log del servidor.
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('workspace_id')
      .limit(1)
      .single()
    if (memberError) console.error('valorar/persistencia members:', memberError.message)
    let propertyId: string | null = null
    if (member) {
      const { data: property, error: propertyError } = await supabase
        .from('properties')
        .insert({
          workspace_id: member.workspace_id,
          kind: subject.kind,
          // Dirección real de CartoCiudad (hidden input); fallback si el submit no la trae.
          address: parsed.data.address ?? '(sin dirección)',
          built_area_m2: subject.builtAreaM2,
          bedrooms: subject.bedrooms,
          floor: subject.floor,
          has_elevator: subject.hasElevator,
          year_built: subject.yearBuilt,
          condition: subject.condition,
          occupancy: subject.occupancy,
          lat: subject.lat,
          lon: subject.lon,
          census_section_id: subject.censusSectionId,
        })
        .select('id')
        .single()
      if (propertyError) console.error('valorar/persistencia properties:', propertyError.message)
      if (property) {
        propertyId = property.id
        const { error: valuationError } = await supabase.from('valuations').insert({
          workspace_id: member.workspace_id,
          property_id: property.id,
          outcome,
          engine_version: 'v0-comparables',
        })
        if (valuationError) console.error('valorar/persistencia valuations:', valuationError.message)
      }
    }

    return { status: 'done', outcome, propertyId }
  } catch (e) {
    return { status: 'error', message: e instanceof Error ? e.message : 'Error inesperado' }
  }
}
