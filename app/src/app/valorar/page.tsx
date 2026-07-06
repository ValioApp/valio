'use client'

import { useActionState } from 'react'
import { Disclaimer } from '@/components/Disclaimer'
import { runValuation, type ValuationFormState } from './actions'

const eur = (n: number) => n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
const pct = (n: number) => `${n >= 0 ? '+' : ''}${(n * 100).toFixed(1)}%`

export default function ValorarPage() {
  const [state, action, pending] = useActionState<ValuationFormState, FormData>(runValuation, { status: 'idle' })

  return (
    <main className="mx-auto max-w-2xl space-y-8 p-6">
      <h1 className="text-2xl font-semibold">Valorar inmueble</h1>

      <form action={action} className="grid grid-cols-2 gap-3">
        <select name="kind" className="rounded-md border px-3 py-2" defaultValue="piso">
          <option value="piso">Piso</option>
          <option value="casa">Casa</option>
        </select>
        <input name="builtAreaM2" type="number" placeholder="m² construidos" required className="rounded-md border px-3 py-2" />
        <input name="bedrooms" type="number" placeholder="Habitaciones" required className="rounded-md border px-3 py-2" />
        <input name="floor" type="number" placeholder="Planta (vacío si casa)" className="rounded-md border px-3 py-2" />
        <label className="flex items-center gap-2 text-sm">
          <input name="hasElevator" type="checkbox" /> Ascensor
        </label>
        <input name="yearBuilt" type="number" placeholder="Año construcción" className="rounded-md border px-3 py-2" />
        <select name="condition" className="rounded-md border px-3 py-2" defaultValue="buen_estado">
          <option value="a_reformar">A reformar</option>
          <option value="buen_estado">Buen estado</option>
          <option value="reformado">Reformado</option>
          <option value="obra_nueva">Obra nueva</option>
        </select>
        <select name="occupancy" className="rounded-md border px-3 py-2" defaultValue="libre">
          <option value="libre">Libre</option>
          <option value="alquilado">Alquilado</option>
          <option value="ocupado">Ocupado</option>
        </select>
        <input name="lat" type="number" step="any" placeholder="Latitud (ej. 41.3797)" required className="rounded-md border px-3 py-2" />
        <input name="lon" type="number" step="any" placeholder="Longitud (ej. 2.1682)" required className="rounded-md border px-3 py-2" />
        {/* Plan 2: se resuelve automáticamente geocodificando la dirección */}
        <select name="censusSectionId" className="col-span-2 rounded-md border px-3 py-2" defaultValue="SEED-RAVAL">
          <option value="SEED-RAVAL">Zona demo: Raval (41.3797, 2.1682)</option>
          <option value="SEED-SARRIA">Zona demo: Sarrià (41.3990, 2.1210)</option>
          <option value="SEED-CORNELLA">Zona demo: Cornellà (41.3560, 2.0750)</option>
        </select>
        <button type="submit" disabled={pending} className="col-span-2 rounded-md bg-black px-3 py-2 text-white disabled:opacity-50">
          {pending ? 'Valorando…' : 'Valorar'}
        </button>
      </form>

      {state.status === 'error' && <p className="text-sm text-red-600">{state.message}</p>}

      {state.status === 'done' && state.outcome.status === 'rejected' && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4">
          <p className="font-medium text-red-800">No podemos valorar este inmueble con rigor.</p>
          <p className="text-sm text-red-700">
            {state.outcome.reason === 'insufficient_comparables'
              ? `Solo hay ${state.outcome.found} testigos comparables (mínimo ${state.outcome.required}). Mejor no valorar que valorar mal.`
              : 'No tenemos estadísticas de esta zona todavía.'}
          </p>
        </div>
      )}

      {state.status === 'done' && state.outcome.status === 'ok' && (
        <section className="space-y-4">
          <div className="rounded-lg border p-5">
            <p className="text-sm text-gray-500">Valor estimado</p>
            <p className="text-4xl font-semibold">{eur(state.outcome.value)}</p>
            <p className="text-sm text-gray-600">
              Horquilla {eur(state.outcome.low)} – {eur(state.outcome.high)} · {eur(state.outcome.pricePerM2)}/m² ·
              Confianza <strong>{state.outcome.confidence}</strong>
            </p>
            <p className="mt-2 text-sm">
              Ajuste por renta de la zona: <strong>{pct(state.outcome.zoneAdjustmentPct)}</strong>
            </p>
          </div>

          <details className="rounded-lg border p-4">
            <summary className="cursor-pointer font-medium">
              {state.outcome.comparables.length} testigos utilizados
            </summary>
            <ul className="mt-3 space-y-2 text-sm">
              {state.outcome.comparables.map((c) => (
                <li key={c.comparable.id} className="rounded border p-2">
                  <span className="font-medium">{eur(Math.round(c.adjustedPricePerM2))}/m² ajustado</span>
                  {' · '}{c.comparable.builtAreaM2} m² · a {Math.round(c.comparable.distanceM)} m ·{' '}
                  {c.comparable.isClosingPrice ? 'cierre' : 'anuncio'} · fuente {c.comparable.source}
                  {c.adjustments.length > 0 && (
                    <span className="block text-xs text-gray-500">
                      {c.adjustments.map((a) => `${a.concept} ${pct(a.pct)}`).join(' · ')}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </details>

          <Disclaimer />
        </section>
      )}
    </main>
  )
}
