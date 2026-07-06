import {
  AGE_ADJ_CAP,
  AGE_ADJ_PER_DECADE,
  CONDITION_ADJ,
  DEFAULT_NEGOTIATION_DISCOUNT,
  FLOOR_NO_ELEVATOR_PER_FLOOR,
  FLOOR_WITH_ELEVATOR_CAP,
  FLOOR_WITH_ELEVATOR_PER_FLOOR,
  OCCUPANCY_ADJ,
  SIZE_ADJ_CAP,
  SIZE_ADJ_PER_M2,
  ZONE_INCOME_ELASTICITY,
} from './coefficients'
import type { Adjustment, AdjustedComparable, Comparable, SubjectProperty, ZoneStats } from './types'

const clamp = (x: number, cap: number) => Math.min(cap, Math.max(-cap, x))

/** Score de planta: cuánto vale la altura de ESTE inmueble respecto a una planta baja tipo. */
function floorScore(floor: number | null, hasElevator: boolean | null): number {
  if (floor === null || floor <= 0) return 0
  if (hasElevator) {
    return Math.min(floor * FLOOR_WITH_ELEVATOR_PER_FLOOR, FLOOR_WITH_ELEVATOR_CAP)
  }
  // sin ascensor: penaliza cada planta por encima de la 1ª
  return Math.max(0, floor - 1) * FLOOR_NO_ELEVATOR_PER_FLOOR
}

/**
 * Homogeneiza un testigo a las condiciones del subject.
 * Cada ajuste es multiplicativo y queda registrado en `adjustments` (trazabilidad ECO-style).
 * El peso de similitud NO se calcula aquí (ver similarity.ts).
 */
export function homogenize(
  subject: SubjectProperty,
  comp: Comparable,
  subjectZone: ZoneStats,
  compZone: ZoneStats,
): Omit<AdjustedComparable, 'weight'> {
  const adjustments: Adjustment[] = []
  let pricePerM2 = comp.price / comp.builtAreaM2

  const apply = (concept: Adjustment['concept'], factor: number) => {
    if (Math.abs(factor - 1) < 1e-9) return
    adjustments.push({ concept, pct: factor - 1 })
    pricePerM2 *= factor
  }

  // 1. Oferta → cierre (si el testigo es un anuncio, con el descuento de SU zona)
  if (!comp.isClosingPrice) {
    const discount = compZone.negotiationDiscount ?? DEFAULT_NEGOTIATION_DISCOUNT
    apply('oferta_a_cierre', 1 - discount)
  }

  // 2. Ocupación: llevar el testigo a la situación del subject
  apply('ocupacion', (1 + OCCUPANCY_ADJ[subject.occupancy]) / (1 + OCCUPANCY_ADJ[comp.occupancy]))

  // 3. Estado de conservación (si el testigo no lo declara, se asume buen_estado)
  const compCondition = comp.condition ?? 'buen_estado'
  apply('estado', (1 + CONDITION_ADJ[subject.condition]) / (1 + CONDITION_ADJ[compCondition]))

  // 4. Planta / ascensor
  apply(
    'planta_ascensor',
    (1 + floorScore(subject.floor, subject.hasElevator)) / (1 + floorScore(comp.floor, comp.hasElevator)),
  )

  // 5. Antigüedad (solo si ambos años son conocidos)
  if (subject.yearBuilt !== null && comp.yearBuilt !== null) {
    const decades = (subject.yearBuilt - comp.yearBuilt) / 10
    apply('antiguedad', 1 + clamp(decades * AGE_ADJ_PER_DECADE, AGE_ADJ_CAP))
  }

  // 6. Superficie (elasticidad del €/m²: pisos pequeños valen más por m²)
  const sizeDiff = comp.builtAreaM2 - subject.builtAreaM2
  apply('superficie', 1 + clamp(sizeDiff * SIZE_ADJ_PER_M2, SIZE_ADJ_CAP))

  // 7. Renta de zona (el diferenciador de VALIO): ratio de coeficientes con elasticidad
  if (subjectZone.censusSectionId !== compZone.censusSectionId) {
    apply('renta_zona', Math.pow(subjectZone.incomeCoef / compZone.incomeCoef, ZONE_INCOME_ELASTICITY))
  }

  return { comparable: comp, adjustments, adjustedPricePerM2: pricePerM2 }
}
