import { homogenize } from './homogenize'
import { comparableWeight, selectComparables } from './similarity'
import { synthesize } from './synthesize'
import type { Comparable, SubjectProperty, ValuationOutcome, ZoneStats } from './types'

/**
 * Orquestador puro del motor: filtra → homogeneiza → pondera → sintetiza.
 * No toca DB ni red: los candidatos y las zonas llegan resueltos (ver data/comparables.ts).
 */
export function valuate(
  subject: SubjectProperty,
  candidates: Comparable[],
  zones: Map<string, ZoneStats>,
  now: Date,
): ValuationOutcome {
  const subjectZone = zones.get(subject.censusSectionId)
  if (!subjectZone) {
    return { status: 'rejected', reason: 'missing_zone_stats', found: 0, required: 1 }
  }

  const usable = selectComparables(subject, candidates, now).filter((c) =>
    zones.has(c.censusSectionId),
  )

  const adjusted = usable.map((comp) => ({
    ...homogenize(subject, comp, subjectZone, zones.get(comp.censusSectionId)!),
    weight: comparableWeight(subject, comp),
  }))

  const zoneAdjustments = adjusted
    .flatMap((a) => a.adjustments)
    .filter((a) => a.concept === 'renta_zona')
  const zoneAdjustmentPct =
    zoneAdjustments.length === 0
      ? 0
      : zoneAdjustments.reduce((s, a) => s + a.pct, 0) / zoneAdjustments.length

  return synthesize(subject.builtAreaM2, adjusted, Number(zoneAdjustmentPct.toFixed(4)))
}
