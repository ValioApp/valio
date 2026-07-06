/** Estados de ocupación — el ajuste por ocupación es diferenciador clave de VALIO. */
export type OccupancyStatus = 'libre' | 'alquilado' | 'ocupado'

export type ConditionRating = 'a_reformar' | 'buen_estado' | 'reformado' | 'obra_nueva'

export type PropertyKind = 'piso' | 'casa'

/** Inmueble a valorar (input del usuario, ya geolocalizado). */
export interface SubjectProperty {
  kind: PropertyKind
  builtAreaM2: number
  bedrooms: number
  /** null = no aplica (casa) */
  floor: number | null
  hasElevator: boolean | null
  yearBuilt: number | null
  condition: ConditionRating
  occupancy: OccupancyStatus
  lat: number
  lon: number
  /** Sección censal INE, ej. '0801902003' */
  censusSectionId: string
}

/** Testigo comparable, ya normalizado por la capa de ingesta. */
export interface Comparable {
  id: string
  kind: PropertyKind
  /** € totales (cierre u oferta según isClosingPrice) */
  price: number
  isClosingPrice: boolean
  builtAreaM2: number
  bedrooms: number | null
  floor: number | null
  hasElevator: boolean | null
  yearBuilt: number | null
  condition: ConditionRating | null
  occupancy: OccupancyStatus
  lat: number
  lon: number
  censusSectionId: string
  /** ISO date de observación (fecha cierre o última vista del anuncio) */
  observedAt: string
  source: string
  /** metros al subject; lo aporta la búsqueda espacial */
  distanceM: number
}

/** Features de zona precalculadas por sección censal (pipeline de zona). */
export interface ZoneStats {
  censusSectionId: string
  municipalityCode: string
  /** Renta neta media por persona (INE ADRH), € */
  netIncomePerCapita: number
  /** Renta del municipio, € — denominador del coeficiente */
  municipalityIncomePerCapita: number
  /** netIncomePerCapita / municipalityIncomePerCapita */
  incomeCoef: number
  /** Descuento medio oferta→cierre de la zona (0.06 = 6%) */
  negotiationDiscount: number
}

export interface Adjustment {
  concept:
    | 'oferta_a_cierre'
    | 'ocupacion'
    | 'estado'
    | 'planta_ascensor'
    | 'antiguedad'
    | 'superficie'
    | 'renta_zona'
  pct: number // -0.12 = -12%
}

export interface AdjustedComparable {
  comparable: Comparable
  adjustments: Adjustment[]
  adjustedPricePerM2: number
  /** peso por similitud (distancia, tamaño, antigüedad del dato, fiabilidad fuente) */
  weight: number
}

export type ConfidenceLevel = 'alta' | 'media' | 'baja'

export type ValuationOutcome =
  | {
      status: 'ok'
      value: number
      low: number
      high: number
      pricePerM2: number
      confidence: ConfidenceLevel
      /** Forecast Standard Deviation aprox. (CV ponderado de los testigos ajustados) */
      fsd: number
      /** Ajuste medio aplicado por renta de zona — la línea "±X% por renta de la zona" */
      zoneAdjustmentPct: number
      comparables: AdjustedComparable[]
    }
  | {
      status: 'rejected'
      reason: 'insufficient_comparables' | 'missing_zone_stats'
      found: number
      required: number
    }
