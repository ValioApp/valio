'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { formatReportDate } from '@/lib/format'
import {
  AlertCircle,
  ArrowRight,
  Building2,
  CircleHelp,
  Loader2,
  MapPin,
  Search,
  TriangleAlert,
} from 'lucide-react'
import { ValuationResult, type SubjectSummary } from '@/components/ValuationResult'
import type { GeocodeCandidate } from '@/services/geocoder'
import { runValuation, type ValuationFormState } from './actions'
import { resolveAddress, searchAddress, type ResolvedAddress } from './resolve-actions'

const INPUT_CLS =
  'w-full rounded-card border border-hairline bg-white px-4 py-2.5 text-base text-ink placeholder:text-muted/50'

const SEGMENT_LABEL_CLS =
  'block cursor-pointer rounded-lg py-2.5 text-center font-medium text-muted transition-all duration-200 ' +
  'peer-checked:bg-petrol peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-petrol/40'

function FieldLabel({ htmlFor, children }: { htmlFor?: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="label-caps mb-2 block text-muted">
      {children}
    </label>
  )
}

export function ValorarForm() {
  const t = useTranslations('valorar')
  const locale = useLocale()
  const [state, action, pending] = useActionState<ValuationFormState, FormData>(runValuation, { status: 'idle' })
  const [occupancy, setOccupancy] = useState('libre')
  const [subject, setSubject] = useState<SubjectSummary | null>(null)

  // Fecha del informe: se fija en el cliente tras montar (ver formatReportDate).
  const [reportDate, setReportDate] = useState('')
  useEffect(() => {
    setReportDate(formatReportDate(new Date(), locale))
  }, [locale])

  // — Dirección: autocomplete (debounce 300 ms) + resolución —
  const [query, setQuery] = useState('')
  const [candidates, setCandidates] = useState<GeocodeCandidate[]>([])
  const [searching, setSearching] = useState(false)
  const [resolving, setResolving] = useState(false)
  const [resolved, setResolved] = useState<ResolvedAddress | null>(null)
  const [resolveError, setResolveError] = useState<string | null>(null)
  const skipNextSearchRef = useRef(false)

  // Prefill del Catastro, editable por el usuario (names intactos: builtAreaM2 / yearBuilt)
  const [area, setArea] = useState('')
  const [yearBuilt, setYearBuilt] = useState('')

  useEffect(() => {
    if (skipNextSearchRef.current) {
      skipNextSearchRef.current = false
      return
    }
    const q = query.trim()
    if (q.length < 3) {
      setCandidates([])
      return
    }
    let cancelled = false
    const timer = setTimeout(() => {
      setSearching(true)
      void searchAddress(q)
        .then((found) => {
          if (!cancelled) setCandidates(found)
        })
        .finally(() => {
          if (!cancelled) setSearching(false)
        })
    }, 300)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [query])

  async function selectCandidate(candidate: GeocodeCandidate) {
    skipNextSearchRef.current = true
    setQuery(candidate.address)
    setCandidates([])
    setResolved(null)
    setResolveError(null)
    setResolving(true)
    const result = await resolveAddress({ id: candidate.id, type: candidate.type })
    setResolving(false)
    if (result.status === 'error') {
      setResolveError(result.message)
      return
    }
    setResolved(result.resolved)
    if (result.resolved.catastro) {
      setArea(String(result.resolved.catastro.builtAreaM2))
      setYearBuilt(result.resolved.catastro.yearBuilt === null ? '' : String(result.resolved.catastro.yearBuilt))
    }
  }

  /** Captura presentacional de los datos enviados (chips del resultado). */
  function captureSubject(e: React.FormEvent<HTMLFormElement>) {
    const fd = new FormData(e.currentTarget)
    const areaSent = Number(fd.get('builtAreaM2'))
    const beds = Number(fd.get('bedrooms'))
    const occ = fd.get('occupancy')
    setSubject({
      kind: fd.get('kind') === 'casa' ? 'casa' : 'piso',
      builtAreaM2: Number.isFinite(areaSent) && areaSent > 0 ? areaSent : null,
      bedrooms: Number.isFinite(beds) && beds >= 0 ? beds : null,
      occupancy: occ === 'alquilado' || occ === 'ocupado' ? occ : 'libre',
    })
  }

  const canSubmit = resolved !== null && resolved.zoneActive && !pending

  return (
    <main className="mx-auto w-full max-w-2xl space-y-6 px-4 py-8 md:px-6 md:py-10">
      <header className="print-hidden">
        <p className="label-caps text-petrol">{t('eyebrow')}</p>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight text-ink">
          {t('title')}
        </h1>
        <p className="mt-2 text-base text-muted">{t('subtitle')}</p>
      </header>

      <form action={action} onSubmit={captureSubject} className="print-hidden space-y-6">
        {/* Localización — dirección real (CartoCiudad → sección censal INE) */}
        <section className="rounded-card border border-hairline bg-white p-6 shadow-ambient">
          <h2 className="mb-5 font-display text-lg font-semibold text-ink">{t('locationTitle')}</h2>

          <div className="relative">
            <FieldLabel htmlFor="addressQuery">{t('addressLabel')}</FieldLabel>
            <div className="relative">
              <input
                id="addressQuery"
                type="text"
                autoComplete="off"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('addressPlaceholder')}
                className={`${INPUT_CLS} pr-10`}
              />
              <span className="absolute top-1/2 right-4 -translate-y-1/2 text-muted" aria-hidden="true">
                {searching || resolving ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
              </span>
            </div>
            {candidates.length > 0 && (
              <ul
                role="listbox"
                aria-label={t('suggestionsAria')}
                className="absolute z-10 mt-1 w-full overflow-hidden rounded-card border border-hairline bg-white shadow-ambient"
              >
                {candidates.map((c) => (
                  <li key={c.id} role="option" aria-selected="false">
                    <button
                      type="button"
                      onClick={() => void selectCandidate(c)}
                      className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-ink hover:bg-paper"
                    >
                      <MapPin size={14} className="shrink-0 text-muted" aria-hidden="true" />
                      <span>
                        {c.address}
                        <span className="text-muted"> · {c.muni} ({c.province})</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {resolveError && (
            <div
              className="mt-4 flex items-start gap-2.5 rounded-card border border-error/25 bg-error/5 p-4 text-sm text-error"
              role="alert"
            >
              <AlertCircle size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
              <p>{resolveError}</p>
            </div>
          )}

          {resolved && resolved.zoneActive && (
            <p className="mt-4 flex items-center gap-1.5 text-xs text-muted">
              <MapPin size={14} className="text-petrol" aria-hidden="true" />
              {t('zoneActive', { section: resolved.censusSectionId })}
              {resolved.incomeCoef !== null && t('zoneCoef', { coef: resolved.incomeCoef.toFixed(2) })}
            </p>
          )}

          {resolved && !resolved.zoneActive && (
            <div className="mt-4 flex items-start gap-3 rounded-card border border-hairline bg-paper p-4">
              <TriangleAlert size={18} className="mt-0.5 shrink-0 text-muted" aria-hidden="true" />
              <div>
                <p className="text-sm font-semibold text-ink">{t('zoneInactiveTitle')}</p>
                <p className="mt-0.5 text-xs text-muted">{t('zoneInactiveBody')}</p>
              </div>
            </div>
          )}

          {resolved && (
            <>
              <input type="hidden" name="address" value={resolved.address} />
              <input type="hidden" name="lat" value={resolved.lat} />
              <input type="hidden" name="lon" value={resolved.lon} />
              <input type="hidden" name="censusSectionId" value={resolved.censusSectionId} />
            </>
          )}
        </section>

        {/* Datos del Catastro — prefill editable (superficie/año viven aquí, no en Características) */}
        {resolved && (
          <section className="rounded-card border border-hairline bg-white p-6 shadow-ambient">
            <div className="mb-4 flex items-center gap-2">
              <Building2 size={18} className="text-petrol" aria-hidden="true" />
              <h2 className="font-display text-lg font-semibold text-ink">{t('catastroTitle')}</h2>
            </div>
            {resolved.catastro ? (
              <p className="mb-5 text-xs text-muted">
                {t('catastroPrefill', {
                  ref: resolved.catastro.refCat,
                  usage: resolved.catastro.usage,
                })}
              </p>
            ) : (
              <p className="mb-5 text-xs text-muted">{t('catastroNone')}</p>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel htmlFor="builtAreaM2">{t('builtAreaLabel')}</FieldLabel>
                <div className="relative">
                  <input
                    id="builtAreaM2"
                    name="builtAreaM2"
                    type="number"
                    required
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    placeholder="78"
                    className={`${INPUT_CLS} pr-10`}
                  />
                  <span className="absolute top-1/2 right-4 -translate-y-1/2 text-sm text-muted">m²</span>
                </div>
              </div>
              <div>
                <FieldLabel htmlFor="yearBuilt">{t('yearBuiltLabel')}</FieldLabel>
                <input
                  id="yearBuilt"
                  name="yearBuilt"
                  type="number"
                  value={yearBuilt}
                  onChange={(e) => setYearBuilt(e.target.value)}
                  placeholder="1990"
                  className={INPUT_CLS}
                />
              </div>
            </div>
          </section>
        )}

        {/* Características */}
        <section className="rounded-card border border-hairline bg-white p-6 shadow-ambient">
          <h2 className="mb-5 font-display text-lg font-semibold text-ink">{t('featuresTitle')}</h2>
          <div className="space-y-6">
            <div>
              <FieldLabel>{t('kindLabel')}</FieldLabel>
              <div className="flex rounded-card border border-hairline bg-paper p-1">
                <div className="flex-1">
                  <input type="radio" id="kind-piso" name="kind" value="piso" defaultChecked className="peer sr-only" />
                  <label htmlFor="kind-piso" className={`${SEGMENT_LABEL_CLS} text-sm`}>{t('kindPiso')}</label>
                </div>
                <div className="flex-1">
                  <input type="radio" id="kind-casa" name="kind" value="casa" className="peer sr-only" />
                  <label htmlFor="kind-casa" className={`${SEGMENT_LABEL_CLS} text-sm`}>{t('kindCasa')}</label>
                </div>
              </div>
            </div>

            <div>
              <FieldLabel>{t('conditionLabel')}</FieldLabel>
              <div className="grid grid-cols-2 gap-1 rounded-card border border-hairline bg-paper p-1">
                {(
                  [
                    ['a_reformar', 'conditionAReformar'],
                    ['buen_estado', 'conditionBuenEstado'],
                    ['reformado', 'conditionReformado'],
                    ['obra_nueva', 'conditionObraNueva'],
                  ] as const
                ).map(([value, labelKey]) => (
                  <div key={value}>
                    <input
                      type="radio"
                      id={`condition-${value}`}
                      name="condition"
                      value={value}
                      defaultChecked={value === 'buen_estado'}
                      className="peer sr-only"
                    />
                    <label htmlFor={`condition-${value}`} className={`${SEGMENT_LABEL_CLS} text-xs`}>
                      {t(labelKey)}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel htmlFor="bedrooms">{t('bedroomsLabel')}</FieldLabel>
                <input id="bedrooms" name="bedrooms" type="number" required placeholder="3" className={INPUT_CLS} />
              </div>
              <div>
                <FieldLabel htmlFor="floor">{t('floorLabel')}</FieldLabel>
                <input id="floor" name="floor" type="number" placeholder="4" className={INPUT_CLS} />
                <p className="mt-1.5 text-xs text-muted">{t('floorHint')}</p>
              </div>
            </div>

            <label className="flex w-fit cursor-pointer items-center gap-3 py-1 select-none">
              <input type="checkbox" name="hasElevator" className="peer sr-only" />
              <span
                aria-hidden="true"
                className="relative h-6 w-11 rounded-full bg-ink/20 transition-colors duration-200 after:absolute after:top-0.5 after:left-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow-sm after:transition-transform after:duration-200 peer-checked:bg-petrol peer-checked:after:translate-x-5 peer-focus-visible:ring-2 peer-focus-visible:ring-petrol/40"
              />
              <span className="label-caps text-muted">{t('elevatorLabel')}</span>
            </label>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label htmlFor="occupancy" className="label-caps text-muted">
                  {t('occupancyLabel')}
                </label>
                <CircleHelp size={16} className="text-muted/60" aria-hidden="true" />
              </div>
              <select
                id="occupancy"
                name="occupancy"
                value={occupancy}
                onChange={(e) => setOccupancy(e.target.value)}
                className={INPUT_CLS}
              >
                <option value="libre">{t('occLibre')}</option>
                <option value="alquilado">{t('occAlquilado')}</option>
                <option value="ocupado">{t('occOcupadoIlegal')}</option>
              </select>
              <p className="mt-2 text-xs text-muted">{t('occupancyHint')}</p>
              {occupancy === 'ocupado' && (
                <div className="mt-3 flex items-start gap-3 rounded-card border border-error/20 bg-error/5 p-4">
                  <TriangleAlert size={18} className="mt-0.5 shrink-0 text-error" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-semibold text-error">{t('riskTitle')}</p>
                    <p className="mt-0.5 text-xs text-muted">{t('riskBody')}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        <button
          type="submit"
          disabled={!canSubmit}
          className="flex w-full items-center justify-center gap-2 rounded-card bg-petrol px-6 py-4 font-display text-lg font-semibold text-white transition-all duration-200 hover:bg-petrol-deep active:scale-[0.99] disabled:opacity-50"
        >
          {pending ? t('submitting') : t('submit')}
          {!pending && <ArrowRight size={20} aria-hidden="true" />}
        </button>
        {resolved === null && (
          <p className="text-center text-xs text-muted">{t('needAddress')}</p>
        )}
      </form>

      {state.status === 'error' && (
        <div
          className="flex items-start gap-2.5 rounded-card border border-error/25 bg-error/5 p-4 text-sm text-error"
          role="alert"
        >
          <AlertCircle size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
          <p>{state.message}</p>
        </div>
      )}

      {state.status === 'done' && (
        <ValuationResult
          outcome={state.outcome}
          subject={subject}
          reportDate={reportDate}
          propertyId={state.propertyId}
        />
      )}
    </main>
  )
}
