import { computeRentability, type RentabilityInput, type RentabilityResult } from './rentability'

export type ScenarioKind = 'conservador' | 'realista' | 'optimista'

export interface ScenarioResult {
  kind: ScenarioKind
  result: RentabilityResult
}

/** Multiplicadores de escenario v0 (heurísticos, 2026-07-07 — VERIFICAR/calibrar):
 * conservador: renta −10%, vacancia 8%, tipo hipoteca +0,5pp
 * realista:    input tal cual
 * optimista:   renta +5%, vacancia 3%, tipo hipoteca −0,25pp (suelo 0)
 */
const SCENARIO_ADJUSTMENTS: Record<
  Exclude<ScenarioKind, 'realista'>,
  { rentMultiplier: number; vacancyPct: number; rateDeltaPp: number }
> = {
  conservador: { rentMultiplier: 0.9, vacancyPct: 0.08, rateDeltaPp: 0.005 },
  optimista: { rentMultiplier: 1.05, vacancyPct: 0.03, rateDeltaPp: -0.0025 },
}

/** Construye el input ajustado para un escenario sin mutar el original. El
 * realista devuelve el input tal cual (mismo resultado que computeRentability(input)). */
function buildScenarioInput(input: RentabilityInput, kind: ScenarioKind): RentabilityInput {
  if (kind === 'realista') return input

  const { rentMultiplier, vacancyPct, rateDeltaPp } = SCENARIO_ADJUSTMENTS[kind]
  return {
    ...input,
    monthlyRent: input.monthlyRent * rentMultiplier,
    vacancyPct,
    mortgage: input.mortgage
      ? { ...input.mortgage, annualRate: Math.max(0, input.mortgage.annualRate + rateDeltaPp) }
      : undefined,
  }
}

/** Devuelve los 3 escenarios de inversión [conservador, realista, optimista] a partir
 * del mismo escenario de compra, ajustando renta/vacancia/tipo de hipoteca (v0). */
export function computeScenarios(input: RentabilityInput): ScenarioResult[] {
  const kinds: ScenarioKind[] = ['conservador', 'realista', 'optimista']
  return kinds.map((kind) => ({
    kind,
    result: computeRentability(buildScenarioInput(input, kind)),
  }))
}
