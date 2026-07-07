import {
  BUILDING_VALUE_PCT,
  DEFAULT_MAINTENANCE_PCT_OF_RENT,
  DEFAULT_VACANCY_PCT,
  IRPF_AMORTIZATION_PCT,
  ITP_BY_CCAA,
  NEW_BUILD_AJD_DEFAULT,
  NEW_BUILD_IVA,
  NOTARY_REGISTRY_AGENCY_PCT,
  type Ccaa,
  type IrpfReduction,
} from './rentability-rates'

/**
 * Módulo puro de rentabilidad inversor post-impuestos (iteración 2 del loop).
 * Cubre el gap con la evidencia más fuerte de la investigación de quejas
 * (F3+F4+F5: "Casafari no calcula rentabilidad neta, TIR ni cash-flow"; las
 * calculadoras gratuitas ignoran impuestos y asumen vacancia 0).
 *
 * Sin red ni DB: entra un escenario de compra, sale el resultado con cada
 * línea trazable (misma filosofía que los `adjustments` del motor).
 * Todos los tipos fiscales son estimaciones v0 documentadas en
 * rentability-rates.ts — verificar antes de producción.
 */

export interface MortgageInput {
  /** Loan-to-value sobre el precio de compra (0.8 = hipoteca del 80%). */
  ltv: number
  /** Tipo de interés nominal anual (0.03 = 3%). */
  annualRate: number
  years: number
}

export interface RentabilityInput {
  purchasePrice: number
  monthlyRent: number
  ccaa: Ccaa
  /** Obra nueva: IVA 10% + AJD en vez de ITP. */
  isNewBuild?: boolean
  renovationCost?: number
  mortgage?: MortgageInput
  annualCosts?: { ibi?: number; community?: number; insurance?: number }
  /** Por defecto DEFAULT_VACANCY_PCT (nunca 0 salvo que se pida explícitamente). */
  vacancyPct?: number
  /** Sin bloque irpf no se calcula la parte fiscal (campos *AfterTax → null). */
  irpf?: { marginalRate: number; reduction: IrpfReduction }
}

/** Línea trazable de un desglose, como los adjustments del motor. */
export interface RentabilityLine {
  concept: string
  amount: number
}

export interface RentabilityResult {
  /** Precio + ITP (o IVA+AJD) + notaría/registro/gestoría + reforma. */
  totalAcquisitionCost: number
  acquisitionBreakdown: RentabilityLine[]
  /** Entrada (precio − principal hipoteca) + impuestos + costes + reforma. */
  cashInvested: number
  /** Renta anual bruta / coste total de adquisición. */
  grossYield: number
  /** (Renta efectiva − gastos operativos) / coste total de adquisición. */
  netYield: number
  /** Cuota mensual (sistema francés); null sin hipoteca. */
  monthlyMortgagePayment: number | null
  /** Intereses de los 12 primeros meses del cuadro de amortización; null sin hipoteca. */
  firstYearInterests: number | null
  /** Renta efectiva/12 − gastos operativos/12 − cuota. */
  monthlyCashflowPreTax: number
  /** Impuesto anual estimado; null sin bloque irpf. */
  irpfAnnualTax: number | null
  monthlyCashflowAfterTax: number | null
  netYieldAfterTax: number | null
  /** Cash-flow anual pre-tax / cash invertido. */
  cashOnCash: number
  /** Desglose de gastos operativos anuales. */
  operatingBreakdown: RentabilityLine[]
  /** Desglose fiscal (rendimiento, deducibles, reducción, cuota); vacío sin irpf. */
  irpfBreakdown: RentabilityLine[]
}

const roundEur = (x: number) => Math.round(x)
const roundYield = (x: number) => Number(x.toFixed(4))
/** División segura: 0 si el denominador no es positivo (evita NaN/Infinity). */
const safeDiv = (num: number, den: number) => (den > 0 ? num / den : 0)

/** Cuota mensual del sistema francés; con tipo 0 degrada a principal/nº meses. */
function frenchMonthlyPayment(principal: number, annualRate: number, years: number): number {
  const months = years * 12
  if (annualRate === 0) return principal / months
  const r = annualRate / 12
  return (principal * r) / (1 - Math.pow(1 + r, -months))
}

/** Suma de intereses de los 12 primeros meses iterando el cuadro de amortización. */
function firstYearInterestsOf(principal: number, annualRate: number, years: number): number {
  if (annualRate === 0) return 0
  const r = annualRate / 12
  const payment = frenchMonthlyPayment(principal, annualRate, years)
  let balance = principal
  let interests = 0
  for (let month = 0; month < 12; month++) {
    const interest = balance * r
    interests += interest
    balance -= payment - interest
  }
  return interests
}

export function computeRentability(input: RentabilityInput): RentabilityResult {
  const price = input.purchasePrice
  const renovation = input.renovationCost ?? 0
  const vacancyPct = input.vacancyPct ?? DEFAULT_VACANCY_PCT

  // ── Adquisición (cada línea redondeada; el total es la suma de las líneas
  //    para que el desglose cuadre siempre al céntimo con lo mostrado) ──
  const acquisitionBreakdown: RentabilityLine[] = [
    { concept: 'Precio de compra', amount: roundEur(price) },
  ]
  if (input.isNewBuild) {
    acquisitionBreakdown.push(
      { concept: 'IVA obra nueva (10%)', amount: roundEur(price * NEW_BUILD_IVA) },
      { concept: 'AJD (aprox. 1,5%)', amount: roundEur(price * NEW_BUILD_AJD_DEFAULT) },
    )
  } else {
    const itpRate = ITP_BY_CCAA[input.ccaa]
    acquisitionBreakdown.push({
      concept: `ITP (${(itpRate * 100).toFixed(1).replace('.', ',').replace(',0', '')}%)`,
      amount: roundEur(price * itpRate),
    })
  }
  acquisitionBreakdown.push({
    concept: 'Notaría, registro y gestoría (aprox. 1,5%)',
    amount: roundEur(price * NOTARY_REGISTRY_AGENCY_PCT),
  })
  if (renovation > 0) {
    acquisitionBreakdown.push({ concept: 'Reforma', amount: roundEur(renovation) })
  }
  const totalAcquisitionCost = acquisitionBreakdown.reduce((s, l) => s + l.amount, 0)

  // ── Hipoteca ──
  const principal = input.mortgage ? price * input.mortgage.ltv : 0
  const exactPayment = input.mortgage
    ? frenchMonthlyPayment(principal, input.mortgage.annualRate, input.mortgage.years)
    : 0
  const exactFirstYearInterests = input.mortgage
    ? firstYearInterestsOf(principal, input.mortgage.annualRate, input.mortgage.years)
    : 0
  const cashInvested = totalAcquisitionCost - roundEur(principal)

  // ── Ingresos y gastos operativos anuales ──
  const grossAnnualRent = input.monthlyRent * 12
  const effectiveAnnualRent = grossAnnualRent * (1 - vacancyPct)

  const operatingBreakdown: RentabilityLine[] = []
  const pushCost = (concept: string, amount: number | undefined) => {
    if (amount !== undefined && amount > 0) {
      operatingBreakdown.push({ concept, amount: roundEur(amount) })
    }
  }
  pushCost('IBI', input.annualCosts?.ibi)
  pushCost('Comunidad', input.annualCosts?.community)
  pushCost('Seguro', input.annualCosts?.insurance)
  pushCost('Mantenimiento (10% de la renta)', grossAnnualRent * DEFAULT_MAINTENANCE_PCT_OF_RENT)
  const operatingCosts = operatingBreakdown.reduce((s, l) => s + l.amount, 0)

  // ── Yields y cash-flow pre-tax ──
  const grossYield = roundYield(safeDiv(grossAnnualRent, totalAcquisitionCost))
  const netYield = roundYield(safeDiv(effectiveAnnualRent - operatingCosts, totalAcquisitionCost))
  const exactCashflowPreTax = effectiveAnnualRent / 12 - operatingCosts / 12 - exactPayment
  const cashOnCash = roundYield(safeDiv(exactCashflowPreTax * 12, cashInvested))

  // ── IRPF (opcional): rendimiento neto → reducción → tipo marginal ──
  let irpfAnnualTax: number | null = null
  const irpfBreakdown: RentabilityLine[] = []
  if (input.irpf) {
    const amortization = BUILDING_VALUE_PCT * price * IRPF_AMORTIZATION_PCT
    const deductible = operatingCosts + exactFirstYearInterests + amortization
    const netIncome = effectiveAnnualRent - deductible
    // v0: rendimiento negativo → cuota 0, sin compensación con otras rentas ni arrastre.
    const exactTax =
      netIncome > 0 ? netIncome * (1 - input.irpf.reduction) * input.irpf.marginalRate : 0
    irpfAnnualTax = roundEur(exactTax)

    irpfBreakdown.push(
      { concept: 'Renta efectiva anual', amount: roundEur(effectiveAnnualRent) },
      { concept: 'Gastos operativos deducibles', amount: -roundEur(operatingCosts) },
    )
    if (input.mortgage) {
      irpfBreakdown.push({
        concept: 'Intereses de hipoteca (año 1)',
        amount: -roundEur(exactFirstYearInterests),
      })
    }
    irpfBreakdown.push(
      { concept: 'Amortización construcción (3% del 60%)', amount: -roundEur(amortization) },
      { concept: 'Rendimiento neto', amount: roundEur(netIncome) },
      {
        concept: `Reducción alquiler vivienda (${input.irpf.reduction * 100}%)`,
        amount: netIncome > 0 ? -roundEur(netIncome * input.irpf.reduction) : 0,
      },
      {
        concept: 'Base imponible',
        amount: netIncome > 0 ? roundEur(netIncome * (1 - input.irpf.reduction)) : 0,
      },
      {
        concept: `Cuota IRPF estimada (tipo ${Math.round(input.irpf.marginalRate * 100)}%)`,
        amount: roundEur(exactTax),
      },
    )
  }

  return {
    totalAcquisitionCost,
    acquisitionBreakdown,
    cashInvested,
    grossYield,
    netYield,
    monthlyMortgagePayment: input.mortgage ? roundEur(exactPayment) : null,
    firstYearInterests: input.mortgage ? roundEur(exactFirstYearInterests) : null,
    monthlyCashflowPreTax: roundEur(exactCashflowPreTax),
    irpfAnnualTax,
    monthlyCashflowAfterTax:
      irpfAnnualTax !== null ? roundEur(exactCashflowPreTax - irpfAnnualTax / 12) : null,
    netYieldAfterTax:
      irpfAnnualTax !== null
        ? roundYield(
            safeDiv(effectiveAnnualRent - operatingCosts - irpfAnnualTax, totalAcquisitionCost),
          )
        : null,
    cashOnCash,
    operatingBreakdown,
    irpfBreakdown,
  }
}
