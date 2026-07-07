import { describe, expect, it } from 'vitest'
import { computeScenarios } from './scenarios'
import { computeRentability, type RentabilityInput } from './rentability'
import { DEFAULT_VACANCY_PCT } from './rentability-rates'

/** Caso base: piso en Cataluña 200.000 €, alquiler 1.000 €/mes, con hipoteca. */
const BASE: RentabilityInput = {
  purchasePrice: 200_000,
  monthlyRent: 1_000,
  ccaa: 'cataluna',
  annualCosts: { ibi: 500, community: 600, insurance: 200 },
  mortgage: { ltv: 0.8, annualRate: 0.03, years: 25 },
}

describe('computeScenarios', () => {
  it('devuelve los 3 escenarios en orden [conservador, realista, optimista]', () => {
    const scenarios = computeScenarios(BASE)
    expect(scenarios.map((s) => s.kind)).toEqual(['conservador', 'realista', 'optimista'])
  })

  it('el escenario realista es exactamente igual a computeRentability(input)', () => {
    const scenarios = computeScenarios(BASE)
    const base = computeRentability(BASE)
    const realista = scenarios.find((s) => s.kind === 'realista')!
    expect(realista.result).toEqual(base)
  })

  it('el cash-flow mensual mejora monotónicamente: conservador ≤ realista ≤ optimista', () => {
    const scenarios = computeScenarios(BASE)
    const [conservador, realista, optimista] = scenarios
    expect(conservador.result.monthlyCashflowPreTax).toBeLessThanOrEqual(
      realista.result.monthlyCashflowPreTax,
    )
    expect(realista.result.monthlyCashflowPreTax).toBeLessThanOrEqual(
      optimista.result.monthlyCashflowPreTax,
    )
  })

  it('aplica vacancia 8% en conservador, la del input (o default) en realista y 3% en optimista', () => {
    const scenarios = computeScenarios(BASE)
    // Reconstruimos manualmente los inputs esperados vía renta efectiva anual:
    // effectiveAnnualRent = grossAnnualRent * (1 - vacancyPct). La comparamos
    // indirectamente a través de netYield, que depende de la renta efectiva.
    const grossAnnualRent = BASE.monthlyRent * 12
    const conservadorRent = grossAnnualRent * 0.9 // renta -10%
    const optimistaRent = grossAnnualRent * 1.05 // renta +5%

    const conservadorExpected = computeRentability({
      ...BASE,
      monthlyRent: (conservadorRent / 12),
      vacancyPct: 0.08,
    })
    const realistaExpected = computeRentability({ ...BASE, vacancyPct: BASE.vacancyPct ?? DEFAULT_VACANCY_PCT })
    const optimistaExpected = computeRentability({
      ...BASE,
      monthlyRent: (optimistaRent / 12),
      vacancyPct: 0.03,
    })

    const [conservador, realista, optimista] = scenarios
    expect(conservador.result.netYield).toBeCloseTo(conservadorExpected.netYield, 6)
    expect(realista.result.netYield).toBeCloseTo(realistaExpected.netYield, 6)
    expect(optimista.result.netYield).toBeCloseTo(optimistaExpected.netYield, 6)
  })

  it('ajusta el tipo de hipoteca ±(0,5/0,25)pp con suelo 0 (rate muy bajo)', () => {
    const lowRateInput: RentabilityInput = {
      ...BASE,
      mortgage: { ltv: 0.8, annualRate: 0.001, years: 25 },
    }
    const scenarios = computeScenarios(lowRateInput)
    const [conservador, , optimista] = scenarios

    const conservadorExpected = computeRentability({
      ...lowRateInput,
      monthlyRent: (BASE.monthlyRent * 12 * 0.9) / 12,
      vacancyPct: 0.08,
      mortgage: { ltv: 0.8, annualRate: 0.001 + 0.005, years: 25 },
    })
    // optimista: 0.001 - 0.0025 sería negativo → suelo 0
    const optimistaExpected = computeRentability({
      ...lowRateInput,
      monthlyRent: (BASE.monthlyRent * 12 * 1.05) / 12,
      vacancyPct: 0.03,
      mortgage: { ltv: 0.8, annualRate: 0, years: 25 },
    })

    expect(conservador.result.monthlyMortgagePayment).toBe(conservadorExpected.monthlyMortgagePayment)
    expect(optimista.result.monthlyMortgagePayment).toBe(optimistaExpected.monthlyMortgagePayment)
  })

  it('sin hipoteca los 3 escenarios difieren solo por renta/vacancia (mismo coste de adquisición)', () => {
    const noMortgage: RentabilityInput = { ...BASE, mortgage: undefined }
    const scenarios = computeScenarios(noMortgage)
    const totals = scenarios.map((s) => s.result.totalAcquisitionCost)
    expect(totals[0]).toBe(totals[1])
    expect(totals[1]).toBe(totals[2])
    // pero los yields difieren (renta/vacancia distintas)
    expect(scenarios[0].result.netYield).not.toBe(scenarios[1].result.netYield)
    expect(scenarios[1].result.netYield).not.toBe(scenarios[2].result.netYield)
  })
})
