/* Tarjeta de valoración del héroe tipo ficha de portal premium: banner con foto
 * del inmueble arriba + valor, horquilla, confianza y desglose de ajustes debajo.
 * Estática (marketing): no consulta Supabase. Foto local en /public/landing → <img>
 * plano con lazy loading, como en BarrioStrip. */
/* eslint-disable @next/next/no-img-element */

import { getTranslations } from 'next-intl/server'
import { Info, MapPin, ShieldCheck } from 'lucide-react'
import { formatEur, formatPct } from '@/lib/format'
import { computeRangeBar } from '@/lib/range-bar'

// Datos de ejemplo realistas (Dreta de l'Eixample, Barcelona) — piso de familia
// clase media-alta, coherente con el rango que devuelve el motor en la zona.
const LOW = 498000
const VALUE = 525000
const HIGH = 552000
const PRICE_PER_M2 = 5050
const WITNESSES = 18

// Ajustes en positivo: lucen el factor de zona, la ventaja de VALIO.
// La barra se dibuja proporcional a la magnitud del ajuste.
const ADJUSTMENTS = [
  { key: 'zone', pct: 0.14 },
  { key: 'condition', pct: 0.08 },
  { key: 'floor', pct: 0.03 },
] as const

const MAX_BAR_PX = 52
// Mayor magnitud del conjunto: normaliza el ancho de las barras a ella.
const MAX_PCT = Math.max(...ADJUSTMENTS.map(({ pct }) => Math.abs(pct)))

export async function HeroValuationCard() {
  const t = await getTranslations('landing.heroCard')
  const { bandLeftPct, bandRightPct, markerLeftPct } = computeRangeBar(LOW, VALUE, HIGH)

  return (
    <div className="valio-card-enter w-full max-w-[410px]">
      <article className="valio-card relative rounded-2xl border border-hairline bg-white shadow-ambient">
        {/* Banner: foto real del inmueble. Esquinas superiores redondeadas flush con
            la tarjeta; la tarjeta NO recorta (overflow) para no cortar el chip inferior. */}
        <div className="overflow-hidden rounded-t-2xl">
          <img
            src="/landing/interior-eixample.jpg"
            alt={t('photoAlt')}
            loading="lazy"
            decoding="async"
            className="aspect-[16/10] w-full object-cover"
          />
        </div>

        <div className="p-5">
          {/* Cabecera: rótulo + ubicación en bajo contraste (el ojo va a la cifra) */}
          <div className="mb-3.5 flex items-start justify-between gap-3">
            <p className="max-w-[9rem] font-display text-[11px] font-semibold uppercase leading-snug tracking-wider text-muted/70">
              {t('eyebrow')}
            </p>
            <span className="inline-flex items-center gap-1 whitespace-nowrap text-[11px] font-medium text-muted/60">
              <MapPin size={11} aria-hidden="true" />
              {t('location')}
            </span>
          </div>

          {/* Cifra protagonista */}
          <p
            data-numeric
            className="font-serif-display text-[2.75rem] font-semibold leading-none tracking-tight text-gold-deep tabular-nums"
          >
            {formatEur(VALUE)}
          </p>

          <div className="mt-2.5 mb-4 flex flex-wrap items-center gap-3">
            <span data-numeric className="text-sm font-medium text-muted tabular-nums">
              {formatEur(PRICE_PER_M2)}/m²
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-gold-deep/30 bg-gold/15 px-2.5 py-1 font-display text-[11px] font-semibold text-gold-deep">
              <ShieldCheck size={12} aria-hidden="true" />
              {t('confidence')}
            </span>
          </div>

          {/* Barra de horquilla: marcador y banda derivados de low/value/high */}
          <div className="mb-5">
            <div className="relative mb-2 h-4 text-[11px] font-medium tabular-nums">
              <span className="absolute left-0 text-muted" style={{ left: `${bandLeftPct}%` }}>
                {formatEur(LOW)}
              </span>
              <span className="absolute left-1/2 -translate-x-1/2 text-muted/60">{t('rangeLabel')}</span>
              <span className="absolute text-muted" style={{ right: `${bandRightPct}%` }}>
                {formatEur(HIGH)}
              </span>
            </div>
            <div className="relative h-1.5 rounded-full border border-hairline bg-[#f4f3ed]">
              <div
                className="absolute -inset-y-px rounded-full"
                style={{
                  left: `${bandLeftPct}%`,
                  right: `${bandRightPct}%`,
                  background: 'linear-gradient(90deg, rgba(212,160,23,.28), rgba(212,160,23,.5))',
                }}
              />
              <div
                className="absolute top-1/2 h-5 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-sm bg-gold"
                style={{ left: `${markerLeftPct}%` }}
              >
                <span className="absolute -top-1.5 left-1/2 h-2.5 w-2.5 -translate-x-1/2 rounded-full border-2 border-white bg-gold-deep" />
              </div>
            </div>
          </div>

          {/* Desglose "por qué" */}
          <div className="mb-1 flex items-center gap-2 border-t border-hairline pt-3.5 font-display text-[11px] font-semibold uppercase tracking-wider text-petrol">
            <Info size={13} aria-hidden="true" />
            {t('whyTitle')}
          </div>
          <div>
            {ADJUSTMENTS.map(({ key, pct }, i) => {
              const barPx = Math.round((Math.abs(pct) / MAX_PCT) * MAX_BAR_PX)
              return (
                <div
                  key={key}
                  className={`flex items-center justify-between py-2 text-[13.5px] ${
                    i < ADJUSTMENTS.length - 1 ? 'border-b border-dashed border-hairline' : ''
                  }`}
                >
                  <span className="text-muted">{t(`rows.${key}`)}</span>
                  <span className="inline-flex items-center gap-1.5 font-semibold tabular-nums text-success">
                    <span
                      className="inline-block h-1.5 rounded-sm bg-current opacity-35"
                      style={{ width: `${barPx}px` }}
                      aria-hidden="true"
                    />
                    {formatPct(pct, 0)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Chip flotante: sobresale por debajo, no tapa contenido */}
        <span className="absolute -bottom-3.5 left-4 inline-flex items-center gap-1.5 rounded-lg bg-petrol-deep px-3 py-2 text-[11px] font-medium text-white shadow-ambient">
          <span data-numeric className="font-semibold text-gold tabular-nums">
            {WITNESSES}
          </span>
          {t('chip')}
        </span>
      </article>
    </div>
  )
}
