'use server'

import { z } from 'zod'
import { getTranslations } from 'next-intl/server'
import { consultaDNPRC, type CatastroProperty } from '@/services/catastro'
import { findAddress, searchCandidates, type FindQuery, type GeocodeCandidate } from '@/services/geocoder'
import { createClient } from '@/lib/supabase/server'

export interface ResolvedAddress {
  address: string
  muni: string
  lat: number
  lon: number
  censusSectionId: string
  /** true si zone_stats tiene renta para la sección (zona activa) */
  zoneActive: boolean
  incomeCoef: number | null
  catastro: CatastroProperty | null
}

export type ResolveResult =
  | { status: 'ok'; resolved: ResolvedAddress }
  | { status: 'error'; message: string }

// Los mensajes de error visibles se traducen con next-intl (namespace `valorar`):
// `errorNoCoverage` (fuera de cobertura) y `errorDbUnavailable` (degradación documentada
// mientras la Task 11 del Plan 1 + migración 0004 no estén hechas; en vez de propagar el
// error crudo de PostgREST se muestra un aviso accionable).

/** Candidatos para el autocomplete. Errores → lista vacía (UX de autocomplete). */
export async function searchAddress(q: string): Promise<GeocodeCandidate[]> {
  const parsed = z.string().trim().min(3).safeParse(q)
  if (!parsed.success) return []
  // createClient/auth dentro del try: sin env de Supabase el action degrada a [] en
  // vez de rechazar la promesa y romper el autocomplete (desviación documentada).
  try {
    const supabase = await createClient()
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) return []
    return await searchCandidates(parsed.data, 5)
  } catch (e) {
    console.error('searchAddress:', e instanceof Error ? e.message : e)
    return []
  }
}

const findQuerySchema = z.union([
  z.object({ q: z.string().trim().min(3) }),
  z.object({ id: z.string().min(1), type: z.string().min(1) }),
])

export async function resolveAddress(query: FindQuery): Promise<ResolveResult> {
  const t = await getTranslations('valorar')
  const parsed = findQuerySchema.safeParse(query)
  if (!parsed.success) return { status: 'error', message: t('errorAddressInvalid') }

  try {
    const supabase = await createClient()
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) return { status: 'error', message: t('errorSession') }

    const geo = await findAddress(parsed.data)

    const { data: cusec, error: rpcError } = await supabase.rpc('census_section_for_point', {
      p_lat: geo.lat,
      p_lon: geo.lng,
    })
    if (rpcError) {
      console.error('census_section_for_point:', rpcError.message)
      return { status: 'error', message: t('errorDbUnavailable') }
    }
    if (!cusec) return { status: 'error', message: t('errorNoCoverage') }

    const { data: zone, error: zoneError } = await supabase
      .from('zone_stats')
      .select('income_coef')
      .eq('census_section_id', cusec as string)
      .maybeSingle()
    if (zoneError) {
      console.error('zone_stats:', zoneError.message)
      return { status: 'error', message: t('errorDbUnavailable') }
    }

    return {
      status: 'ok',
      resolved: {
        address: geo.address,
        muni: geo.muni,
        lat: geo.lat,
        lon: geo.lng,
        censusSectionId: cusec as string,
        zoneActive: zone !== null,
        incomeCoef: zone === null ? null : Number(zone.income_coef),
        catastro: await getCatastroWithCache(supabase, geo.refCatastral),
      },
    }
  } catch (e) {
    return { status: 'error', message: e instanceof Error ? e.message : t('errorUnexpected') }
  }
}

/**
 * catastro_cache: guardamos el CatastroProperty YA parseado (decisión: payload pequeño y
 * tipado; si en el futuro cambia el parser, se purga la caché y se repuebla).
 * El Catastro caído NO bloquea la resolución: devuelve null y el usuario rellena a mano.
 */
async function getCatastroWithCache(
  supabase: Awaited<ReturnType<typeof createClient>>,
  refCat: string | null,
): Promise<CatastroProperty | null> {
  if (refCat === null) return null
  const { data: hit } = await supabase
    .from('catastro_cache')
    .select('payload')
    .eq('ref_cat', refCat)
    .maybeSingle()
  if (hit) return hit.payload as CatastroProperty
  try {
    const fresh = await consultaDNPRC(refCat)
    const { error } = await supabase
      .from('catastro_cache')
      .upsert({ ref_cat: refCat, payload: fresh }, { onConflict: 'ref_cat', ignoreDuplicates: true })
    if (error) console.error('catastro_cache upsert:', error.message)
    return fresh
  } catch (e) {
    console.error('consultaDNPRC:', e instanceof Error ? e.message : e)
    return null
  }
}
