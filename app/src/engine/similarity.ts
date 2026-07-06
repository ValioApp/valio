import {
  MAX_COMPARABLES,
  MAX_OBSERVED_AGE_MONTHS,
  MAX_SIZE_DEVIATION,
  WEIGHT_DISTANCE_HALF_M,
  WEIGHT_LISTING_SOURCE,
  WEIGHT_SIZE_HALF_M2,
} from './coefficients'
import type { Comparable, SubjectProperty } from './types'

/** Peso de similitud ∈ (0, 1]: distancia, diferencia de tamaño y fiabilidad de la fuente. */
export function comparableWeight(subject: SubjectProperty, comp: Comparable): number {
  const wDistance = 1 / (1 + comp.distanceM / WEIGHT_DISTANCE_HALF_M)
  const wSize = 1 / (1 + Math.abs(comp.builtAreaM2 - subject.builtAreaM2) / WEIGHT_SIZE_HALF_M2)
  const wSource = comp.isClosingPrice ? 1 : WEIGHT_LISTING_SOURCE
  return wDistance * wSize * wSource
}

function monthsBetween(a: Date, b: Date): number {
  return Math.abs(a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24 * 30.44)
}

/** Filtra candidatos no comparables y devuelve los MAX_COMPARABLES mejores por peso. */
export function selectComparables(
  subject: SubjectProperty,
  candidates: Comparable[],
  now: Date,
): Comparable[] {
  return candidates
    .filter((c) => c.kind === subject.kind)
    .filter(
      (c) =>
        c.builtAreaM2 >= subject.builtAreaM2 * (1 - MAX_SIZE_DEVIATION) &&
        c.builtAreaM2 <= subject.builtAreaM2 * (1 + MAX_SIZE_DEVIATION),
    )
    .filter((c) => monthsBetween(new Date(c.observedAt), now) <= MAX_OBSERVED_AGE_MONTHS)
    .sort((a, b) => comparableWeight(subject, b) - comparableWeight(subject, a))
    .slice(0, MAX_COMPARABLES)
}
