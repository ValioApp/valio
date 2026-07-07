import { CONFIDENCE_HIGH, CONFIDENCE_MEDIUM } from '@/engine/coefficients'
import type { AdjustedComparable, ConfidenceLevel } from '@/engine/types'

/**
 * Explicación honesta del nivel de confianza (anti caja-negra).
 * La queja nº1 documentada contra los AVM es no explicar el porqué; aquí se
 * expone con qué datos se calculó y qué faltaría para subir de nivel.
 */
export interface ConfidenceExplanation {
  reasons: string[]
  /** Qué faltaría para el siguiente nivel; null si ya es 'alta'. */
  nextLevelHint: string | null
}

const pctEs = (x: number) => `${(x * 100).toFixed(1).replace('.', ',')}%`

function missingFor(
  target: { maxFsd: number; minComps: number },
  n: number,
  fsd: number,
): string[] {
  const parts: string[] = []
  if (n < target.minComps) parts.push(`al menos ${target.minComps} testigos (hay ${n})`)
  if (fsd > target.maxFsd)
    parts.push(`dispersión ≤ ${pctEs(target.maxFsd)} (está en ${pctEs(fsd)})`)
  return parts
}

export function explainConfidence(
  confidence: ConfidenceLevel,
  fsd: number,
  comparables: AdjustedComparable[],
): ConfidenceExplanation {
  const n = comparables.length
  const closings = comparables.filter((c) => c.comparable.isClosingPrice).length

  const reasons = [
    closings > 0
      ? `${n} testigos comparables, ${closings} con precio de cierre real`
      : `${n} testigos comparables, todos precios de anuncio`,
    `dispersión del ${pctEs(fsd)} entre los €/m² ajustados`,
  ]
  if (confidence === 'baja') {
    reasons.push('horquilla amplia: tómala como orientación de zona, no como precio')
  }

  if (confidence === 'alta') return { reasons, nextLevelHint: null }

  const target = confidence === 'media' ? CONFIDENCE_HIGH : CONFIDENCE_MEDIUM
  const targetName = confidence === 'media' ? 'alta' : 'media'
  const missing = missingFor(target, n, fsd)
  return {
    reasons,
    nextLevelHint:
      missing.length > 0
        ? `Para confianza ${targetName} haría falta ${missing.join(' y ')}.`
        : null,
  }
}
