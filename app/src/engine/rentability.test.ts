import { describe, expect, it } from 'vitest'
import { computeRentability, type RentabilityInput } from './rentability'
import {
  BUILDING_VALUE_PCT,
  DEFAULT_MAINTENANCE_PCT_OF_RENT,
  DEFAULT_VACANCY_PCT,
  IRPF_AMORTIZATION_PCT,
  ITP_BY_CCAA,
  NEW_BUILD_AJD_DEFAULT,
  NEW_BUILD_IVA,
  NOTARY_REGISTRY_AGENCY_PCT,
} from './rentability-rates'

/** Cuota francesa exacta calculada con la fórmula (no inventada). */
function frenchPayment(principal: number, annualRate: number, years: number): number {
  const n = years * 12
  if (annualRate === 0) return principal / n
  const r = annualRate / 12
  return (principal * r) / (1 - Math.pow(1 + r, -n))
}

/** Intereses del primer año iterando el cuadro de amortización, como el módulo. */
function firstYearInterestsRef(principal: number, annualRate: number, years: number): number {
  const r = annualRate / 12
  const payment = frenchPayment(principal, annualRate, years)
  let balance = principal
  let interests = 0
  for (let m = 0; m < 12; m++) {
    const interest = balance * r
    interests += interest
    balance -= payment - interest
  }
  return interests
}

const sum = (lines: { amount: number }[]) => lines.reduce((s, l) => s + l.amount, 0)

/** Caso base: piso en Cataluña 200.000 €, alquiler 1.000 €/mes, gastos típicos. */
const BASE: RentabilityInput = {
  purchasePrice: 200_000,
  monthlyRent: 1_000,
  ccaa: 'cataluna',
  annualCosts: { ibi: 500, community: 600, insurance: 200 },
}

describe('computeRentability — adquisición e ITP', () => {
  it('Cataluña usada: ITP 10% + notaría 1,5% y el breakdown cuadra con el total', () => {
    const r = computeRentability(BASE)
    // 200.000 + 20.000 (ITP) + 3.000 (notaría/registro/gestoría) = 223.000
    expect(r.totalAcquisitionCost).toBe(223_000)
    const itp = r.acquisitionBreakdown.find((l) => l.concept.startsWith('ITP'))
    expect(itp?.amount).toBe(Math.round(200_000 * ITP_BY_CCAA.cataluna))
    expect(sum(r.acquisitionBreakdown)).toBe(r.totalAcquisitionCost)
  })

  it('Madrid usada: ITP 6% (8.000 € menos que Cataluña a mismo precio)', () => {
    const cat = computeRentability(BASE)
    const mad = computeRentability({ ...BASE, ccaa: 'madrid' })
    const itp = mad.acquisitionBreakdown.find((l) => l.concept.startsWith('ITP'))
    expect(itp?.amount).toBe(12_000)
    expect(cat.totalAcquisitionCost - mad.totalAcquisitionCost).toBe(8_000)
  })

  it('obra nueva: IVA 10% + AJD 1,5% en vez de ITP', () => {
    const r = computeRentability({ ...BASE, isNewBuild: true })
    const iva = r.acquisitionBreakdown.find((l) => l.concept.startsWith('IVA'))
    const ajd = r.acquisitionBreakdown.find((l) => l.concept.startsWith('AJD'))
    expect(iva?.amount).toBe(Math.round(200_000 * NEW_BUILD_IVA))
    expect(ajd?.amount).toBe(Math.round(200_000 * NEW_BUILD_AJD_DEFAULT))
    expect(r.acquisitionBreakdown.some((l) => l.concept.startsWith('ITP'))).toBe(false)
    // 200.000 + 20.000 + 3.000 + 3.000 = 226.000
    expect(r.totalAcquisitionCost).toBe(226_000)
    expect(sum(r.acquisitionBreakdown)).toBe(r.totalAcquisitionCost)
  })

  it('la reforma entra en el coste de adquisición y en el cash invertido', () => {
    const r = computeRentability({ ...BASE, renovationCost: 15_000 })
    expect(r.totalAcquisitionCost).toBe(238_000)
    expect(r.cashInvested).toBe(238_000) // sin hipoteca: todo el capital
    expect(sum(r.acquisitionBreakdown)).toBe(r.totalAcquisitionCost)
  })
})

describe('computeRentability — hipoteca (sistema francés)', () => {
  it('80% LTV, 3%, 25 años: cuota exacta de la fórmula francesa', () => {
    const r = computeRentability({ ...BASE, mortgage: { ltv: 0.8, annualRate: 0.03, years: 25 } })
    const expected = frenchPayment(160_000, 0.03, 25) // = 160000·0,0025/(1−1,0025^−300)
    expect(r.monthlyMortgagePayment).toBe(Math.round(expected))
    // Sanity: la fórmula da ≈ 758,74 €/mes
    expect(expected).toBeGreaterThan(758)
    expect(expected).toBeLessThan(760)
  })

  it('intereses del primer año = suma de los 12 primeros meses del cuadro', () => {
    const r = computeRentability({ ...BASE, mortgage: { ltv: 0.8, annualRate: 0.03, years: 25 } })
    expect(r.firstYearInterests).toBe(Math.round(firstYearInterestsRef(160_000, 0.03, 25)))
  })

  it('con hipoteca el cash invertido es la entrada + impuestos y costes', () => {
    const r = computeRentability({ ...BASE, mortgage: { ltv: 0.8, annualRate: 0.03, years: 25 } })
    // 223.000 total − 160.000 de principal = 63.000
    expect(r.cashInvested).toBe(63_000)
    // cash-flow mensual pre-tax = 11.400/12 − 2.500/12 − cuota
    const payment = frenchPayment(160_000, 0.03, 25)
    expect(r.monthlyCashflowPreTax).toBe(Math.round(11_400 / 12 - 2_500 / 12 - payment))
    expect(r.cashOnCash).toBe(
      Number((((11_400 / 12 - 2_500 / 12 - payment) * 12) / 63_000).toFixed(4)),
    )
  })

  it('tipo 0%: la cuota degrada a principal / nº de meses y los intereses son 0', () => {
    const r = computeRentability({ ...BASE, mortgage: { ltv: 0.8, annualRate: 0, years: 25 } })
    expect(r.monthlyMortgagePayment).toBe(Math.round(160_000 / 300))
    expect(r.firstYearInterests).toBe(0)
  })

  it('sin hipoteca: cuota e intereses null y cash-on-cash sobre todo el capital', () => {
    const r = computeRentability(BASE)
    expect(r.monthlyMortgagePayment).toBeNull()
    expect(r.firstYearInterests).toBeNull()
    expect(r.cashInvested).toBe(r.totalAcquisitionCost)
    // (11.400 − 2.500) / 223.000 = 0,0399…
    expect(r.cashOnCash).toBe(Number((8_900 / 223_000).toFixed(4)))
  })
})

describe('computeRentability — yields y vacancia', () => {
  it('yield bruto = renta anual bruta / coste total; neto descuenta vacancia y gastos', () => {
    const r = computeRentability(BASE)
    expect(r.grossYield).toBe(Number((12_000 / 223_000).toFixed(4)))
    // Renta efectiva 12.000×0,95 = 11.400; gastos 500+600+200+1.200 (mant. 10%) = 2.500
    expect(r.netYield).toBe(Number(((11_400 - 2_500) / 223_000).toFixed(4)))
    expect(sum(r.operatingBreakdown)).toBe(2_500)
  })

  it('la vacancia por defecto es 5% (nunca 0): explicitar 0 da yield neto mayor', () => {
    const withDefault = computeRentability(BASE)
    const withZero = computeRentability({ ...BASE, vacancyPct: 0 })
    expect(DEFAULT_VACANCY_PCT).toBe(0.05)
    expect(withZero.netYield).toBeGreaterThan(withDefault.netYield)
    expect(withZero.netYield).toBe(Number(((12_000 - 2_500) / 223_000).toFixed(4)))
  })

  it('renta 0 → yields y cash-flow 0, sin NaN', () => {
    const r = computeRentability({ purchasePrice: 200_000, monthlyRent: 0, ccaa: 'cataluna' })
    expect(r.grossYield).toBe(0)
    expect(r.netYield).toBe(0)
    expect(r.monthlyCashflowPreTax).toBe(0)
    expect(r.cashOnCash).toBe(0)
    expect(Number.isNaN(r.grossYield)).toBe(false)
    expect(Number.isNaN(r.cashOnCash)).toBe(false)
  })
})

describe('computeRentability — IRPF', () => {
  it('sin bloque irpf → campos fiscales null y sin breakdown', () => {
    const r = computeRentability(BASE)
    expect(r.irpfAnnualTax).toBeNull()
    expect(r.monthlyCashflowAfterTax).toBeNull()
    expect(r.netYieldAfterTax).toBeNull()
    expect(r.irpfBreakdown).toEqual([])
  })

  it('reducción 50%: rendimiento − deducibles, media reducción, tipo marginal', () => {
    const r = computeRentability({ ...BASE, irpf: { marginalRate: 0.3, reduction: 0.5 } })
    // Rendimiento neto = 11.400 − (2.500 gastos + 0 intereses + 3.600 amortización) = 5.300
    const amortization = BUILDING_VALUE_PCT * 200_000 * IRPF_AMORTIZATION_PCT
    expect(amortization).toBe(3_600)
    // Base = 5.300 × 0,5 = 2.650 → impuesto = 2.650 × 0,3 = 795
    expect(r.irpfAnnualTax).toBe(795)
    expect(r.monthlyCashflowAfterTax).toBe(Math.round(8_900 / 12 - 795 / 12))
    expect(r.netYieldAfterTax).toBe(Number(((11_400 - 2_500 - 795) / 223_000).toFixed(4)))
  })

  it('reducción 90% (zona tensionada con rebaja de renta): impuesto mucho menor', () => {
    const r = computeRentability({ ...BASE, irpf: { marginalRate: 0.3, reduction: 0.9 } })
    // Base = 5.300 × 0,1 = 530 → impuesto = 159
    expect(r.irpfAnnualTax).toBe(159)
  })

  it('con hipoteca los intereses del año 1 son deducibles', () => {
    const r = computeRentability({
      ...BASE,
      mortgage: { ltv: 0.8, annualRate: 0.03, years: 25 },
      irpf: { marginalRate: 0.3, reduction: 0.5 },
    })
    const interests = firstYearInterestsRef(160_000, 0.03, 25)
    const net = 11_400 - (2_500 + interests + 3_600)
    expect(r.irpfAnnualTax).toBe(Math.round(net * 0.5 * 0.3))
  })

  it('rendimiento neto negativo → impuesto 0 (v0: sin compensaciones)', () => {
    const r = computeRentability({
      purchasePrice: 200_000,
      monthlyRent: 300,
      ccaa: 'cataluna',
      annualCosts: { ibi: 2_000 },
      irpf: { marginalRate: 0.45, reduction: 0.5 },
    })
    // Rendimiento = 3.420 − (2.000 + 360 mant. + 3.600 amort.) = −2.540 → 0 €
    expect(r.irpfAnnualTax).toBe(0)
    expect(r.monthlyCashflowAfterTax).toBe(r.monthlyCashflowPreTax)
  })

  it('el breakdown fiscal cuadra: rendimiento × (1−reducción) = base; base × tipo = cuota', () => {
    const r = computeRentability({ ...BASE, irpf: { marginalRate: 0.3, reduction: 0.5 } })
    const get = (prefix: string) =>
      r.irpfBreakdown.find((l) => l.concept.startsWith(prefix))?.amount
    expect(get('Rendimiento neto')).toBe(5_300)
    expect(get('Base imponible')).toBe(2_650)
    expect(get('Cuota IRPF')).toBe(795)
    expect(get('Reducción')).toBe(-2_650)
  })
})

describe('computeRentability — constantes documentadas', () => {
  it('las tasas v0 usadas en los cálculos son las declaradas', () => {
    expect(NOTARY_REGISTRY_AGENCY_PCT).toBe(0.015)
    expect(DEFAULT_MAINTENANCE_PCT_OF_RENT).toBe(0.1)
    expect(ITP_BY_CCAA.madrid).toBe(0.06)
    expect(ITP_BY_CCAA.cataluna).toBe(0.1)
  })
})
