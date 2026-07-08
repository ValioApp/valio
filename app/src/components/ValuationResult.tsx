'use client'

import { useLocale, useTranslations } from 'next-intl'
import {
  AlertTriangle,
  BadgePercent,
  Building2,
  CalendarClock,
  ChartColumn,
  LockKeyhole,
  MapPin,
  Ruler,
  Wrench,
  type LucideIcon,
} from 'lucide-react'
import { ConfidencePill } from '@/components/ConfidencePill'
import { Disclaimer } from '@/components/Disclaimer'
import { PrintButton } from '@/components/PrintButton'
import { PropertyPhotos } from '@/components/PropertyPhotos'
import { RentabilityCard } from '@/components/RentabilityCard'
import { ReportHeader } from '@/components/ReportHeader'
import {
  explainConfidence,
  type ConfidenceHintToken,
  type ConfidenceReasonToken,
} from '@/lib/confidence'
import { formatEur, formatPct, formatPercentPlain } from '@/lib/format'
import { analyzeOccupancy } from '@/lib/occupancy'
import type {
  Adjustment,
  OccupancyStatus,
  PropertyKind,
  ValuationOutcome,
} from '@/engine/types'

/** Resumen del inmueble enviado (para los chips de características). */
export interface SubjectSummary {
  kind: PropertyKind
  builtAreaM2: number | null
  bedrooms: number | null
  occupancy: OccupancyStatus
}

type OkOutcome = Extract<ValuationOutcome, { status: 'ok' }>
type AdjustmentConcept = Adjustment['concept']

/** Icono por concepto de ajuste; la etiqueta la resuelve i18n (`result.concept.*`). */
const CONCEPT_ICON: Record<AdjustmentConcept, LucideIcon> = {
  oferta_a_cierre: BadgePercent,
  renta_zona: MapPin,
  ocupacion: LockKeyhole,
  estado: Wrench,
  planta_ascensor: Building2,
  antiguedad: CalendarClock,
  superficie: Ruler,
}

const CONCEPT_ORDER: AdjustmentConcept[] = [
  'oferta_a_cierre',
  'renta_zona',
  'ocupacion',
  'estado',
  'planta_ascensor',
  'antiguedad',
  'superficie',
]

const OCCUPANCY_KEY: Record<OccupancyStatus, 'occLibre' | 'occAlquilado' | 'occOcupado'> = {
  libre: 'occLibre',
  alquilado: 'occAlquilado',
  ocupado: 'occOcupado',
}

/**
 * Media de los ajustes aplicados a los testigos, por concepto (misma
 * convención que zoneAdjustmentPct en el motor: media de los presentes).
 * renta_zona usa directamente outcome.zoneAdjustmentPct y se muestra siempre.
 */
function aggregateAdjustments(outcome: OkOutcome): { concept: AdjustmentConcept; pct: number }[] {
  const sums = new Map<AdjustmentConcept, { sum: number; n: number }>()
  for (const comp of outcome.comparables) {
    for (const adj of comp.adjustments) {
      const acc = sums.get(adj.concept) ?? { sum: 0, n: 0 }
      acc.sum += adj.pct
      acc.n += 1
      sums.set(adj.concept, acc)
    }
  }
  const rows: { concept: AdjustmentConcept; pct: number }[] = []
  for (const concept of CONCEPT_ORDER) {
    if (concept === 'renta_zona') {
      rows.push({ concept, pct: outcome.zoneAdjustmentPct })
      continue
    }
    const acc = sums.get(concept)
    if (acc) rows.push({ concept, pct: acc.sum / acc.n })
  }
  return rows
}

function pctTextClass(pct: number): string {
  if (pct < 0) return 'text-error'
  if (pct > 0) return 'text-success'
  return 'text-muted'
}

function pctIconClass(pct: number): string {
  if (pct < 0) return 'bg-error/10 text-error'
  if (pct > 0) return 'bg-success/10 text-success'
  return 'bg-paper text-muted'
}

function RejectedCard({ outcome }: { outcome: Extract<ValuationOutcome, { status: 'rejected' }> }) {
  const t = useTranslations('result')
  return (
    <div className="flex items-start gap-3 rounded-card border border-error/25 bg-error/5 p-6" role="alert">
      <AlertTriangle size={20} className="mt-0.5 shrink-0 text-error" aria-hidden="true" />
      <div>
        <p className="font-display text-base font-semibold text-error">{t('rejectedTitle')}</p>
        <p className="mt-1 text-sm text-muted">
          {outcome.reason === 'insufficient_comparables'
            ? t('rejectedInsufficient', { found: outcome.found, required: outcome.required })
            : t('rejectedNoStats')}
        </p>
      </div>
    </div>
  )
}

export function ValuationResult({
  outcome,
  subject,
  reportDate = '',
  propertyId = null,
}: {
  outcome: ValuationOutcome
  subject?: SubjectSummary | null
  /** Fecha ya formateada (locale activo) para la cabecera imprimible; ver ReportHeader. */
  reportDate?: string
  /** Property persistida al valorar. Si viene, se muestra el carrusel de fotos. */
  propertyId?: string | null
}) {
  const t = useTranslations('result')
  const tc = useTranslations('confidence')
  const tProp = useTranslations('property')
  const locale = useLocale()

  if (outcome.status === 'rejected') return <RejectedCard outcome={outcome} />

  const adjustments = aggregateAdjustments(outcome)
  const occupancyPenalized = adjustments.some((a) => a.concept === 'ocupacion' && a.pct < 0)
  const span = outcome.high - outcome.low
  const ratio = span > 0 ? (outcome.value - outcome.low) / span : 0.5
  const markerLeftPct = 12 + Math.min(Math.max(ratio, 0), 1) * 76
  const confidenceExplanation = explainConfidence(
    outcome.confidence,
    outcome.fsd,
    outcome.comparables,
  )
  const occupancyAnalysis = analyzeOccupancy(outcome)

  const reasonText = (r: ConfidenceReasonToken): string => {
    switch (r.key) {
      case 'comparablesWithClosings':
        return tc('reasonComparablesWithClosings', { n: r.n, closings: r.closings })
      case 'comparablesNoClosings':
        return tc('reasonComparablesNoClosings', { n: r.n })
      case 'dispersion':
        return tc('reasonDispersion', { fsd: formatPercentPlain(r.fsd, locale, { min: 1, max: 1 }) })
      case 'wideRange':
        return tc('reasonWideRange')
    }
  }

  const hintText = (hint: ConfidenceHintToken): string => {
    const missing = hint.missing
      .map((m) =>
        m.key === 'minComps'
          ? tc('hintMinComps', { required: m.required, have: m.have })
          : tc('hintMaxDispersion', {
              max: formatPercentPlain(m.max, locale, { min: 1, max: 1 }),
              current: formatPercentPlain(m.current, locale, { min: 1, max: 1 }),
            }),
      )
      .join(tc('hintJoin'))
    const level = hint.targetLevel === 'alta' ? tc('levelAlta') : tc('levelMedia')
    return tc('hintIntro', { level, missing })
  }

  return (
    <section className="space-y-6">
      <ReportHeader date={reportDate} subject={subject} />

      {/* Chips de características */}
      {subject && (
        <div className="flex flex-wrap gap-2 font-display text-xs font-semibold tracking-wide">
          <span className="rounded-full border border-hairline bg-white px-4 py-1.5 text-ink">
            {tProp(subject.kind === 'piso' ? 'kindPiso' : 'kindCasa')}
          </span>
          {subject.builtAreaM2 !== null && (
            <span className="rounded-full border border-hairline bg-white px-4 py-1.5 text-ink tabular-nums">
              {subject.builtAreaM2} m²
            </span>
          )}
          {subject.bedrooms !== null && (
            <span className="rounded-full border border-hairline bg-white px-4 py-1.5 text-ink tabular-nums">
              {subject.bedrooms} {tProp('bedroomsShort')}
            </span>
          )}
          <span
            className={`rounded-full px-4 py-1.5 ${
              subject.occupancy === 'ocupado'
                ? 'bg-petrol text-white'
                : 'border border-hairline bg-white text-ink'
            }`}
          >
            {tProp(OCCUPANCY_KEY[subject.occupancy])}
          </span>
        </div>
      )}

      {/* Banda visual de fotos del inmueble (lo primero que quiere ver quien valora) */}
      {propertyId && <PropertyPhotos propertyId={propertyId} />}

      {/* Card de valor con acento dorado */}
      <div className="break-inside-avoid rounded-card border border-hairline border-l-4 border-l-gold bg-white p-6 shadow-ambient md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="label-caps text-muted">{t('valueTitle')}</p>
            <p className="mt-2 font-display text-5xl font-bold tracking-tight text-gold-deep tabular-nums md:text-6xl">
              {formatEur(outcome.value, locale)}
            </p>
            <p className="mt-2 font-display text-sm font-medium text-muted tabular-nums">
              {formatEur(outcome.pricePerM2, locale)}/m²
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <ConfidencePill level={outcome.confidence} withPrefix />
            <PrintButton />
          </div>
        </div>

        {/* Barra de rango low — valor — high */}
        <div className="mt-8 space-y-3">
          <div className="relative h-2 w-full rounded-full bg-hairline">
            <div className="absolute inset-y-0 right-[12%] left-[12%] rounded-full bg-gold/30" />
            <div
              className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-gold shadow-sm"
              style={{ left: `${markerLeftPct}%` }}
              aria-hidden="true"
            />
          </div>
          <div className="flex justify-between font-display text-sm font-medium tabular-nums">
            <span className="text-muted">{formatEur(outcome.low, locale)}</span>
            <span className="font-bold text-petrol-deep">{formatEur(outcome.value, locale)}</span>
            <span className="text-muted">{formatEur(outcome.high, locale)}</span>
          </div>
        </div>

        {/* Confianza explicada — anti caja-negra (queja nº1 de los AVM) */}
        <div className="mt-6 border-t border-hairline pt-4">
          <p className="label-caps text-muted">{t('confidenceWhy')}</p>
          <ul className="mt-2 space-y-1 text-sm text-muted">
            {confidenceExplanation.reasons.map((reason) => (
              <li key={reason.key} className="flex items-start gap-2">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-petrol/40" aria-hidden="true" />
                <span>{reasonText(reason)}</span>
              </li>
            ))}
          </ul>
          {confidenceExplanation.nextLevelHint && (
            <p className="mt-2 text-sm text-petrol">{hintText(confidenceExplanation.nextLevelHint)}</p>
          )}
        </div>
      </div>

      {/* Análisis de compra ocupada (P4) — nadie más lo pondera */}
      {occupancyAnalysis && (
        <div className="break-inside-avoid rounded-card border border-petrol/25 bg-petrol/5 p-6 shadow-ambient">
          <div className="flex items-start gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-petrol/10 text-petrol">
              <LockKeyhole size={18} aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="label-caps text-petrol">{t('occAnalysisTitle')}</p>
              <p className="mt-2 text-sm text-ink">
                {t.rich('occFreeValue', {
                  freeValue: formatEur(occupancyAnalysis.freeValue, locale),
                  pct: Math.round(occupancyAnalysis.pctOfFreeValue * 100),
                  b: (chunks) => (
                    <span className="font-display font-bold text-gold-deep tabular-nums">{chunks}</span>
                  ),
                })}
              </p>
              <p
                className={`mt-1 text-sm font-medium ${
                  occupancyAnalysis.withinInvestorRule ? 'text-success' : 'text-error'
                }`}
              >
                {occupancyAnalysis.withinInvestorRule ? t('occWithinRule') : t('occAboveRule')}
              </p>
              <p className="mt-1 text-xs text-muted">{t('occEstimateNote')}</p>
            </div>
          </div>
        </div>
      )}

      {/* Por qué este valor */}
      <div className="break-inside-avoid rounded-card border border-hairline bg-white p-6 shadow-ambient">
        <h3 className="mb-4 font-display text-lg font-semibold text-ink">{t('valueWhy')}</h3>
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-4 rounded-lg p-3 transition-colors hover:bg-paper">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-paper text-muted">
                <ChartColumn size={18} aria-hidden="true" />
              </span>
              <span className="text-sm text-ink">
                {t('homogenized', { count: outcome.comparables.length })}
              </span>
            </div>
            <span className="font-display text-sm font-semibold text-ink tabular-nums">
              {formatEur(outcome.pricePerM2, locale)}/m²
            </span>
          </div>
          {adjustments.map(({ concept, pct }) => {
            const Icon = CONCEPT_ICON[concept]
            return (
              <div
                key={concept}
                className="flex items-center justify-between gap-4 rounded-lg p-3 transition-colors hover:bg-paper"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${pctIconClass(pct)}`}
                  >
                    <Icon size={18} aria-hidden="true" />
                  </span>
                  <span className="text-sm text-ink">{t(`concept.${concept}`)}</span>
                </div>
                <span
                  className={`font-display text-sm font-semibold tabular-nums ${pctTextClass(pct)}`}
                >
                  {formatPct(pct, locale)}
                </span>
              </div>
            )
          })}
        </div>
        {occupancyPenalized && (
          <div className="mt-4 rounded-lg border border-gold/25 bg-gold/10 p-4">
            <p className="text-sm font-medium text-gold-deep">
              {t.rich('occupancyNote', { b: (chunks) => <span className="font-bold">{chunks}</span> })}
            </p>
          </div>
        )}
      </div>

      {/* Rentabilidad como inversión (gap nº1 de la competencia: F3+F4+F5) */}
      <RentabilityCard estimatedValue={outcome.value} builtAreaM2={subject?.builtAreaM2} />

      {/* Testigos */}
      <div className="break-inside-avoid rounded-card border border-hairline bg-white p-6 shadow-ambient">
        <h3 className="mb-4 font-display text-lg font-semibold text-ink">
          {t('testigosHeading', { count: outcome.comparables.length })}
        </h3>
        <div>
          <div className="grid grid-cols-[minmax(0,1fr)_72px_96px] border-b border-hairline px-3 py-2">
            <span className="label-caps text-muted">{t('colSourceM2')}</span>
            <span className="label-caps text-right text-muted">{t('colDist')}</span>
            <span className="label-caps text-right text-muted">{t('colEurM2')}</span>
          </div>
          {outcome.comparables.map((c, i) => (
            <div
              key={c.comparable.id}
              className={`grid grid-cols-[minmax(0,1fr)_72px_96px] items-center rounded-lg px-3 py-2.5 ${
                i % 2 === 1 ? 'bg-paper' : ''
              }`}
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink">
                  <span className="capitalize">{c.comparable.source}</span>{' '}
                  <span
                    className={`ml-1 inline-block rounded-tag px-1.5 py-0.5 align-middle font-display text-[10px] font-semibold tracking-wide uppercase ${
                      c.comparable.isClosingPrice
                        ? 'bg-petrol/10 text-petrol-deep'
                        : 'border border-hairline bg-white text-muted'
                    }`}
                  >
                    {c.comparable.isClosingPrice ? t('tagCierre') : t('tagAnuncio')}
                  </span>
                </p>
                <p className="font-display text-xs text-muted tabular-nums">
                  {c.comparable.builtAreaM2} m²
                  {c.comparable.bedrooms !== null && ` · ${c.comparable.bedrooms} ${tProp('bedroomsShort')}`}
                </p>
              </div>
              <span className="text-right font-display text-sm text-muted tabular-nums">
                {Math.round(c.comparable.distanceM)} m
              </span>
              <span className="text-right font-display text-sm font-bold text-gold-deep tabular-nums">
                {formatEur(Math.round(c.adjustedPricePerM2), locale)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <Disclaimer />
    </section>
  )
}
