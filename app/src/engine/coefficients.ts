import type { ConditionRating, OccupancyStatus } from './types'

/** Calibración v0 (heurística, 2026-07-07). Recalibrar con cierres reales del socio. */

/** Prima/descuento sobre valor libre. Un ocupado se compra con fuerte descuento. */
export const OCCUPANCY_ADJ: Record<OccupancyStatus, number> = {
  libre: 0,
  alquilado: -0.15,
  ocupado: -0.4,
}

export const CONDITION_ADJ: Record<ConditionRating, number> = {
  a_reformar: -0.12,
  buen_estado: 0,
  reformado: 0.08,
  obra_nueva: 0.15,
}

/** Ajuste por planta: con ascensor suma por altura (vistas/luz), sin ascensor penaliza. */
export const FLOOR_WITH_ELEVATOR_PER_FLOOR = 0.01 // hasta +6%
export const FLOOR_WITH_ELEVATOR_CAP = 0.06
export const FLOOR_NO_ELEVATOR_PER_FLOOR = -0.02 // a partir de 1º

/** Antigüedad: ±2% por década de diferencia, tope ±10%. */
export const AGE_ADJ_PER_DECADE = 0.02
export const AGE_ADJ_CAP = 0.1

/** Superficie: los pisos pequeños valen más €/m². ±0.1%/m² de diferencia, tope ±8%. */
export const SIZE_ADJ_PER_M2 = 0.001
export const SIZE_ADJ_CAP = 0.08

/** Elasticidad del factor renta de zona: (coefSubject/coefComp)^ELASTICITY. */
export const ZONE_INCOME_ELASTICITY = 0.5

/** Descuento oferta→cierre por defecto si la zona no aporta el suyo. */
export const DEFAULT_NEGOTIATION_DISCOUNT = 0.06

/** Regla de oro: con menos de 6 testigos el motor rehúsa valorar. */
export const MIN_COMPARABLES = 6
export const MAX_COMPARABLES = 20

/** Umbrales de confianza (FSD ≈ CV ponderado). */
export const CONFIDENCE_HIGH = { maxFsd: 0.13, minComps: 10 }
export const CONFIDENCE_MEDIUM = { maxFsd: 0.2, minComps: 6 }

/** Filtros de candidatos. */
export const MAX_SIZE_DEVIATION = 0.4 // ±40% de superficie
export const MAX_OBSERVED_AGE_MONTHS = 18

/** Pesos de similitud. */
export const WEIGHT_DISTANCE_HALF_M = 500 // a 500 m el peso por distancia es 0.5
export const WEIGHT_SIZE_HALF_M2 = 50
export const WEIGHT_LISTING_SOURCE = 0.8 // un anuncio pesa menos que un cierre
