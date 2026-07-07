/**
 * Tasas y coeficientes v0 del módulo de rentabilidad inversor (2026-07-07).
 *
 * ⚠️ TODAS son estimaciones generales para orientar, NO asesoramiento fiscal:
 * VERIFICAR cada tipo con la normativa vigente (y con asesor) antes de producción.
 * Separadas del cálculo (como coefficients.ts) para poder actualizarlas sin tocar
 * la lógica ni los tests de fórmulas.
 */

/**
 * Tipos ITP generales por CCAA para vivienda usada (v0 2026 — VERIFICAR antes de
 * producción). Solo el tipo general: sin bonificaciones (jóvenes, familia numerosa,
 * VPO…) ni tramos por precio. País Vasco varía por territorio foral; se usa un
 * tipo orientativo único.
 * Fuente: cuadros autonómicos ITP-AJD publicados por las CCAA (consulta 2026-07).
 */
export const ITP_BY_CCAA = {
  andalucia: 0.07,
  aragon: 0.08,
  asturias: 0.08,
  baleares: 0.08,
  canarias: 0.065,
  cantabria: 0.09,
  castilla_la_mancha: 0.09,
  castilla_y_leon: 0.08,
  cataluna: 0.1,
  extremadura: 0.08,
  galicia: 0.08,
  la_rioja: 0.07,
  madrid: 0.06,
  murcia: 0.08,
  navarra: 0.06,
  pais_vasco: 0.07,
  valencia: 0.1,
} satisfies Record<string, number>

export type Ccaa = keyof typeof ITP_BY_CCAA

/** Obra nueva: IVA en vez de ITP (tipo general vivienda, art. 91 LIVA — v0 2026). */
export const NEW_BUILD_IVA = 0.1

/** AJD aproximado en obra nueva (varía por CCAA, 0,5–1,5% — v0: VERIFICAR). */
export const NEW_BUILD_AJD_DEFAULT = 0.015

/** Notaría + registro + gestoría, aproximación conjunta sobre precio (v0: VERIFICAR). */
export const NOTARY_REGISTRY_AGENCY_PCT = 0.015

/**
 * Vacancia por defecto: nunca 0 (F7 de la investigación de quejas 2026-07-07 —
 * las calculadoras gratuitas asumen ocupación perfecta y inflan el yield).
 */
export const DEFAULT_VACANCY_PCT = 0.05

/** Mantenimiento anual estimado como % de la renta bruta anual (v0 heurístico). */
export const DEFAULT_MAINTENANCE_PCT_OF_RENT = 0.1

/**
 * % del precio imputable a la construcción (excluye suelo) para la amortización
 * IRPF. La ley amortiza el 3% del mayor entre coste de construcción y valor
 * catastral de construcción; sin catastro a mano, v0 asume 60% construcción.
 */
export const BUILDING_VALUE_PCT = 0.6

/** Amortización anual IRPF sobre el valor de construcción (art. 23.1.b LIRPF). */
export const IRPF_AMORTIZATION_PCT = 0.03

/**
 * Reducciones IRPF por alquiler de vivienda habitual (Ley 12/2023, art. 23.2 LIRPF,
 * contratos desde 2024 — VERIFICAR condiciones caso a caso):
 * - 0.5  → general
 * - 0.6  → vivienda con rehabilitación en los 2 años anteriores
 * - 0.7  → primer alquiler a jóvenes (18-35) en zona tensionada, o alquiler social
 * - 0.9  → zona tensionada con rebaja de renta ≥5% sobre el contrato anterior
 * - 0    → sin reducción (p. ej. alquiler no de vivienda habitual)
 */
export type IrpfReduction = 0 | 0.5 | 0.6 | 0.7 | 0.9
