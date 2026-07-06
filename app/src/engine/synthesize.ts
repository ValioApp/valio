import { CONFIDENCE_HIGH, CONFIDENCE_MEDIUM, MIN_COMPARABLES } from './coefficients'
import type { AdjustedComparable, ConfidenceLevel, ValuationOutcome } from './types'

/** Mediana ponderada: primer valor cuyo peso acumulado alcanza el 50%. */
export function weightedMedian(values: number[], weights: number[]): number {
  const pairs = values.map((v, i) => [v, weights[i]] as const).sort((a, b) => a[0] - b[0])
  const total = pairs.reduce((s, [, w]) => s + w, 0)
  let acc = 0
  for (const [v, w] of pairs) {
    acc += w
    if (acc >= total / 2) return v
  }
  return pairs[pairs.length - 1][0]
}

function confidence(n: number, fsd: number): ConfidenceLevel {
  if (n >= CONFIDENCE_HIGH.minComps && fsd <= CONFIDENCE_HIGH.maxFsd) return 'alta'
  if (n >= CONFIDENCE_MEDIUM.minComps && fsd <= CONFIDENCE_MEDIUM.maxFsd) return 'media'
  return 'baja'
}

export function synthesize(
  subjectAreaM2: number,
  adjusted: AdjustedComparable[],
  zoneAdjustmentPct: number,
): ValuationOutcome {
  if (adjusted.length < MIN_COMPARABLES) {
    return {
      status: 'rejected',
      reason: 'insufficient_comparables',
      found: adjusted.length,
      required: MIN_COMPARABLES,
    }
  }

  const prices = adjusted.map((a) => a.adjustedPricePerM2)
  const weights = adjusted.map((a) => a.weight)
  const totalW = weights.reduce((s, w) => s + w, 0)

  const pricePerM2 = weightedMedian(prices, weights)
  const mean = prices.reduce((s, p, i) => s + p * weights[i], 0) / totalW
  const variance = prices.reduce((s, p, i) => s + weights[i] * (p - mean) ** 2, 0) / totalW
  const fsd = Math.sqrt(variance) / mean

  const value = pricePerM2 * subjectAreaM2
  return {
    status: 'ok',
    value: Math.round(value),
    low: Math.max(0, Math.round(value * (1 - fsd))),
    high: Math.round(value * (1 + fsd)),
    pricePerM2: Math.round(pricePerM2),
    confidence: confidence(adjusted.length, fsd),
    fsd: Number(fsd.toFixed(4)),
    zoneAdjustmentPct,
    comparables: adjusted,
  }
}
