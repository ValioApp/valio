import { CONFIDENCE_HIGH, CONFIDENCE_MEDIUM } from '@/engine/coefficients'
import type { AdjustedComparable, ConfidenceLevel } from '@/engine/types'

/**
 * Explicación honesta del nivel de confianza (anti caja-negra).
 * La queja nº1 documentada contra los AVM es no explicar el porqué; aquí se
 * expone con qué datos se calculó y qué faltaría para subir de nivel.
 *
 * i18n: la función es pura y NO produce texto — devuelve tokens estructurados
 * (clave + parámetros) que el componente traduce con next-intl. Así el copy
 * vive en los catálogos es/ca/en y la lógica de umbrales queda intacta.
 */
export type ConfidenceReasonToken =
  | { key: 'comparablesWithClosings'; n: number; closings: number }
  | { key: 'comparablesNoClosings'; n: number }
  | { key: 'dispersion'; fsd: number }
  | { key: 'wideRange' }

export type ConfidenceMissingToken =
  | { key: 'minComps'; required: number; have: number }
  | { key: 'maxDispersion'; max: number; current: number }

export interface ConfidenceHintToken {
  /** Nivel al que se aspira (para el texto "Para confianza …"). */
  targetLevel: Exclude<ConfidenceLevel, 'baja'>
  missing: ConfidenceMissingToken[]
}

export interface ConfidenceExplanation {
  reasons: ConfidenceReasonToken[]
  /** Qué faltaría para el siguiente nivel; null si ya es 'alta'. */
  nextLevelHint: ConfidenceHintToken | null
}

function missingFor(
  target: { maxFsd: number; minComps: number },
  n: number,
  fsd: number,
): ConfidenceMissingToken[] {
  const parts: ConfidenceMissingToken[] = []
  if (n < target.minComps) parts.push({ key: 'minComps', required: target.minComps, have: n })
  if (fsd > target.maxFsd) parts.push({ key: 'maxDispersion', max: target.maxFsd, current: fsd })
  return parts
}

export function explainConfidence(
  confidence: ConfidenceLevel,
  fsd: number,
  comparables: AdjustedComparable[],
): ConfidenceExplanation {
  const n = comparables.length
  const closings = comparables.filter((c) => c.comparable.isClosingPrice).length

  const reasons: ConfidenceReasonToken[] = [
    closings > 0
      ? { key: 'comparablesWithClosings', n, closings }
      : { key: 'comparablesNoClosings', n },
    { key: 'dispersion', fsd },
  ]
  if (confidence === 'baja') {
    reasons.push({ key: 'wideRange' })
  }

  if (confidence === 'alta') return { reasons, nextLevelHint: null }

  const target = confidence === 'media' ? CONFIDENCE_HIGH : CONFIDENCE_MEDIUM
  const targetLevel: Exclude<ConfidenceLevel, 'baja'> = confidence === 'media' ? 'alta' : 'media'
  const missing = missingFor(target, n, fsd)
  return {
    reasons,
    nextLevelHint: missing.length > 0 ? { targetLevel, missing } : null,
  }
}
