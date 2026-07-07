import type { ValuationOutcome } from '@/engine/types'

type OkOutcome = Extract<ValuationOutcome, { status: 'ok' }>

/**
 * Análisis de compra ocupada (P4): estima el valor equivalente libre a partir
 * del ajuste medio de ocupación aplicado a los testigos, y sitúa la compra
 * frente a la regla del inversor distressed (no pagar más del 60-70% del
 * valor libre). Aproximación exacta cuando todos los testigos comparten
 * estado de ocupación; por eso se presenta como estimación.
 */
export interface OccupancyAnalysis {
  /** Ajuste medio de ocupación aplicado (negativo, ej. -0.4) */
  meanAdjustmentPct: number
  /** Valor estimado si el inmueble estuviera libre */
  freeValue: number
  /** Cuánto representa el valor ocupado sobre el libre (0.6 = 60%) */
  pctOfFreeValue: number
  /** true si está dentro de la regla 60-70% (comprar a ≤70% del libre) */
  withinInvestorRule: boolean
}

const INVESTOR_RULE_MAX_PCT = 0.7

/** Devuelve null si no hubo ajuste de ocupación negativo (inmueble libre). */
export function analyzeOccupancy(outcome: OkOutcome): OccupancyAnalysis | null {
  const adjustments = outcome.comparables.flatMap((c) =>
    c.adjustments.filter((a) => a.concept === 'ocupacion'),
  )
  if (adjustments.length === 0) return null

  const meanAdjustmentPct =
    adjustments.reduce((s, a) => s + a.pct, 0) / adjustments.length
  if (meanAdjustmentPct >= 0) return null

  const pctOfFreeValue = 1 + meanAdjustmentPct
  if (pctOfFreeValue <= 0) return null

  const freeValue = Math.round(outcome.value / pctOfFreeValue)
  return {
    meanAdjustmentPct,
    freeValue,
    pctOfFreeValue,
    withinInvestorRule: pctOfFreeValue <= INVESTOR_RULE_MAX_PCT,
  }
}
