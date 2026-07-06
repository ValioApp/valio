'use client'

import { useActionState, useState } from 'react'
import { AlertCircle, ArrowRight, CircleHelp, Info, TriangleAlert } from 'lucide-react'
import { ValuationResult, type SubjectSummary } from '@/components/ValuationResult'
import { runValuation, type ValuationFormState } from './actions'

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

export default function ValorarPage() {
  const [state, action, pending] = useActionState<ValuationFormState, FormData>(runValuation, { status: 'idle' })
  const [occupancy, setOccupancy] = useState('libre')
  const [subject, setSubject] = useState<SubjectSummary | null>(null)

  /** Captura presentacional de los datos enviados (chips del resultado). */
  function captureSubject(e: React.FormEvent<HTMLFormElement>) {
    const fd = new FormData(e.currentTarget)
    const area = Number(fd.get('builtAreaM2'))
    const beds = Number(fd.get('bedrooms'))
    const occ = fd.get('occupancy')
    setSubject({
      kind: fd.get('kind') === 'casa' ? 'casa' : 'piso',
      builtAreaM2: Number.isFinite(area) && area > 0 ? area : null,
      bedrooms: Number.isFinite(beds) && beds >= 0 ? beds : null,
      occupancy: occ === 'alquilado' || occ === 'ocupado' ? occ : 'libre',
    })
  }

  return (
    <main className="mx-auto w-full max-w-2xl space-y-6 px-4 py-8 md:px-6 md:py-10">
      <header>
        <p className="label-caps text-petrol">Valoración residencial</p>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight text-ink">
          Valorar inmueble
        </h1>
        <p className="mt-2 text-base text-muted">
          Indique la zona y las características para obtener el valor orientativo.
        </p>
      </header>

      <form action={action} onSubmit={captureSubject} className="space-y-6">
        {/* Localización (demo — Plan 2 lo sustituye por geocoding) */}
        <section className="rounded-card border border-hairline bg-white p-6 shadow-ambient">
          <h2 className="mb-5 font-display text-lg font-semibold text-ink">Localización</h2>
          <div className="space-y-5">
            <div>
              <FieldLabel htmlFor="censusSectionId">Zona (demo)</FieldLabel>
              <select id="censusSectionId" name="censusSectionId" defaultValue="SEED-RAVAL" className={INPUT_CLS}>
                <option value="SEED-RAVAL">Zona demo: Raval (41.3797, 2.1682)</option>
                <option value="SEED-SARRIA">Zona demo: Sarrià (41.3990, 2.1210)</option>
                <option value="SEED-CORNELLA">Zona demo: Cornellà (41.3560, 2.0750)</option>
              </select>
              <p className="mt-2 flex items-center gap-1.5 text-xs text-muted">
                <Info size={14} aria-hidden="true" />
                En el Plan 2 detectaremos la sección censal geocodificando la dirección.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel htmlFor="lat">Latitud</FieldLabel>
                <input id="lat" name="lat" type="number" step="any" required placeholder="41.3797" className={INPUT_CLS} />
              </div>
              <div>
                <FieldLabel htmlFor="lon">Longitud</FieldLabel>
                <input id="lon" name="lon" type="number" step="any" required placeholder="2.1682" className={INPUT_CLS} />
              </div>
            </div>
          </div>
        </section>

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
                <FieldLabel htmlFor="builtAreaM2">M² construidos</FieldLabel>
                <div className="relative">
                  <input
                    id="builtAreaM2"
                    name="builtAreaM2"
                    type="number"
                    required
                    placeholder="78"
                    className={`${INPUT_CLS} pr-10`}
                  />
                  <span className="absolute top-1/2 right-4 -translate-y-1/2 text-sm text-muted">m²</span>
                </div>
              </div>
              <div>
                <FieldLabel htmlFor="bedrooms">Habitaciones</FieldLabel>
                <input id="bedrooms" name="bedrooms" type="number" required placeholder="3" className={INPUT_CLS} />
              </div>
              <div>
                <FieldLabel htmlFor="floor">Planta</FieldLabel>
                <input id="floor" name="floor" type="number" placeholder="4" className={INPUT_CLS} />
                <p className="mt-1.5 text-xs text-muted">Déjelo vacío si es casa.</p>
              </div>
              <div>
                <FieldLabel htmlFor="yearBuilt">Año construcción</FieldLabel>
                <input id="yearBuilt" name="yearBuilt" type="number" placeholder="1990" className={INPUT_CLS} />
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
          disabled={pending}
          className="flex w-full items-center justify-center gap-2 rounded-card bg-petrol px-6 py-4 font-display text-lg font-semibold text-white transition-all duration-200 hover:bg-petrol-deep active:scale-[0.99] disabled:opacity-50"
        >
          {pending ? 'Valorando…' : 'Valorar inmueble'}
          {!pending && <ArrowRight size={20} aria-hidden="true" />}
        </button>
      </form>

      {state.status === 'error' && (
        <div className="flex items-start gap-2.5 rounded-card border border-error/25 bg-error/5 p-4 text-sm text-error" role="alert">
          <AlertCircle size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
          <p>{state.message}</p>
        </div>
      )}

      {state.status === 'done' && <ValuationResult outcome={state.outcome} subject={subject} />}
    </main>
  )
}
