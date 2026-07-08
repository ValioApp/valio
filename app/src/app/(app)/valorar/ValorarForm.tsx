'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
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
  const [state, action, pending] = useActionState<ValuationFormState, FormData>(runValuation, { status: 'idle' })
  const [occupancy, setOccupancy] = useState('libre')
  const [subject, setSubject] = useState<SubjectSummary | null>(null)

  // Fecha del informe: se fija en el cliente tras montar (ver formatReportDate).
  const [reportDate, setReportDate] = useState('')
  useEffect(() => {
    setReportDate(formatReportDate(new Date()))
  }, [])

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
        <p className="label-caps text-petrol">Valoración residencial</p>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight text-ink">
          Valorar inmueble
        </h1>
        <p className="mt-2 text-base text-muted">
          Busque la dirección y ajuste las características para obtener el valor orientativo.
        </p>
      </header>

      <form action={action} onSubmit={captureSubject} className="print-hidden space-y-6">
        {/* Localización — dirección real (CartoCiudad → sección censal INE) */}
        <section className="rounded-card border border-hairline bg-white p-6 shadow-ambient">
          <h2 className="mb-5 font-display text-lg font-semibold text-ink">Localización</h2>

          <div className="relative">
            <FieldLabel htmlFor="addressQuery">Dirección</FieldLabel>
            <div className="relative">
              <input
                id="addressQuery"
                type="text"
                autoComplete="off"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Carrer de l'Hospital 92, Barcelona"
                className={`${INPUT_CLS} pr-10`}
              />
              <span className="absolute top-1/2 right-4 -translate-y-1/2 text-muted" aria-hidden="true">
                {searching || resolving ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
              </span>
            </div>
            {candidates.length > 0 && (
              <ul
                role="listbox"
                aria-label="Direcciones sugeridas"
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
              Zona activa — sección censal {resolved.censusSectionId}
              {resolved.incomeCoef !== null && <> · coef. renta {resolved.incomeCoef.toFixed(2)}</>}
            </p>
          )}

          {resolved && !resolved.zoneActive && (
            <div className="mt-4 flex items-start gap-3 rounded-card border border-hairline bg-paper p-4">
              <TriangleAlert size={18} className="mt-0.5 shrink-0 text-muted" aria-hidden="true" />
              <div>
                <p className="text-sm font-semibold text-ink">Aún no cubrimos esta zona</p>
                <p className="mt-0.5 text-xs text-muted">
                  Barcelona y área metropolitana primero. Estamos ampliando la cobertura por fases.
                </p>
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
              <h2 className="font-display text-lg font-semibold text-ink">Datos del Catastro</h2>
            </div>
            {resolved.catastro ? (
              <p className="mb-5 text-xs text-muted">
                Finca {resolved.catastro.refCat} · uso {resolved.catastro.usage}. Prefill del inmueble
                residencial de mayor superficie de la finca: revise y corrija si no corresponde al suyo.
              </p>
            ) : (
              <p className="mb-5 text-xs text-muted">
                No hemos podido recuperar datos del Catastro para esta dirección. Indique la superficie
                y el año manualmente.
              </p>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel htmlFor="builtAreaM2">M² construidos</FieldLabel>
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
                <FieldLabel htmlFor="yearBuilt">Año construcción</FieldLabel>
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
          <h2 className="mb-5 font-display text-lg font-semibold text-ink">Características</h2>
          <div className="space-y-6">
            <div>
              <FieldLabel>Tipo de inmueble</FieldLabel>
              <div className="flex rounded-card border border-hairline bg-paper p-1">
                <div className="flex-1">
                  <input type="radio" id="kind-piso" name="kind" value="piso" defaultChecked className="peer sr-only" />
                  <label htmlFor="kind-piso" className={`${SEGMENT_LABEL_CLS} text-sm`}>Piso</label>
                </div>
                <div className="flex-1">
                  <input type="radio" id="kind-casa" name="kind" value="casa" className="peer sr-only" />
                  <label htmlFor="kind-casa" className={`${SEGMENT_LABEL_CLS} text-sm`}>Casa</label>
                </div>
              </div>
            </div>

            <div>
              <FieldLabel>Estado de conservación</FieldLabel>
              <div className="grid grid-cols-2 gap-1 rounded-card border border-hairline bg-paper p-1">
                {(
                  [
                    ['a_reformar', 'A reformar'],
                    ['buen_estado', 'Buen estado'],
                    ['reformado', 'Reformado'],
                    ['obra_nueva', 'Obra nueva'],
                  ] as const
                ).map(([value, label]) => (
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
                      {label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel htmlFor="bedrooms">Habitaciones</FieldLabel>
                <input id="bedrooms" name="bedrooms" type="number" required placeholder="3" className={INPUT_CLS} />
              </div>
              <div>
                <FieldLabel htmlFor="floor">Planta</FieldLabel>
                <input id="floor" name="floor" type="number" placeholder="4" className={INPUT_CLS} />
                <p className="mt-1.5 text-xs text-muted">Déjelo vacío si es casa.</p>
              </div>
            </div>

            <label className="flex w-fit cursor-pointer items-center gap-3 py-1 select-none">
              <input type="checkbox" name="hasElevator" className="peer sr-only" />
              <span
                aria-hidden="true"
                className="relative h-6 w-11 rounded-full bg-ink/20 transition-colors duration-200 after:absolute after:top-0.5 after:left-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow-sm after:transition-transform after:duration-200 peer-checked:bg-petrol peer-checked:after:translate-x-5 peer-focus-visible:ring-2 peer-focus-visible:ring-petrol/40"
              />
              <span className="label-caps text-muted">Ascensor</span>
            </label>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label htmlFor="occupancy" className="label-caps text-muted">
                  Situación de ocupación
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
                <option value="libre">Libre</option>
                <option value="alquilado">Alquilado</option>
                <option value="ocupado">Ocupado (ilegalmente)</option>
              </select>
              <p className="mt-2 text-xs text-muted">
                La ocupación es uno de los ajustes clave del motor de valoración.
              </p>
              {occupancy === 'ocupado' && (
                <div className="mt-3 flex items-start gap-3 rounded-card border border-error/20 bg-error/5 p-4">
                  <TriangleAlert size={18} className="mt-0.5 shrink-0 text-error" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-semibold text-error">Aviso de riesgo</p>
                    <p className="mt-0.5 text-xs text-muted">
                      La ocupación ilegal penaliza de forma severa el valor de mercado y requiere
                      procesos legales específicos.
                    </p>
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
          {pending ? 'Valorando…' : 'Valorar inmueble'}
          {!pending && <ArrowRight size={20} aria-hidden="true" />}
        </button>
        {resolved === null && (
          <p className="text-center text-xs text-muted">
            Busque y seleccione una dirección para poder valorar.
          </p>
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
