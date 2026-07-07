'use client'

import { useId, useMemo, useState } from 'react'
import { Info } from 'lucide-react'
import { computeRentability, type RentabilityLine } from '@/engine/rentability'
import { ITP_BY_CCAA, type Ccaa, type IrpfReduction } from '@/engine/rentability-rates'
import { estimateRenovation, RENOVATION_LABELS, type RenovationLevel } from '@/engine/renovation'
import { computeScenarios, type ScenarioKind } from '@/engine/scenarios'
import { formatEur } from '@/lib/format'

/**
 * Card interactiva de rentabilidad inversor (iteración 2 del loop).
 * El cálculo es una función pura (engine/rentability) que se recalcula en vivo
 * al editar el escenario. El precio de compra parte del valor estimado pero es
 * editable: un inversor compara "¿y si lo compro a X?".
 */

const INPUT_CLS =
  'w-full rounded-card border border-hairline bg-white px-4 py-2.5 text-base text-ink placeholder:text-muted/50'

const CCAA_LABELS: Record<Ccaa, string> = {
  andalucia: 'Andalucía',
  aragon: 'Aragón',
  asturias: 'Asturias',
  baleares: 'Baleares',
  canarias: 'Canarias',
  cantabria: 'Cantabria',
  castilla_la_mancha: 'Castilla-La Mancha',
  castilla_y_leon: 'Castilla y León',
  cataluna: 'Cataluña',
  extremadura: 'Extremadura',
  galicia: 'Galicia',
  la_rioja: 'La Rioja',
  madrid: 'Madrid',
  murcia: 'Murcia',
  navarra: 'Navarra',
  pais_vasco: 'País Vasco',
  valencia: 'Comunidad Valenciana',
}

const MARGINAL_RATES = [0.19, 0.24, 0.3, 0.37, 0.45, 0.47] as const

const IRPF_REDUCTIONS: { value: IrpfReduction; label: string }[] = [
  { value: 0.5, label: '50% — alquiler vivienda general' },
  { value: 0.6, label: '60% — reforma en los 2 años anteriores' },
  { value: 0.7, label: '70% — jóvenes / zona tensionada con condiciones' },
  { value: 0.9, label: '90% — zona tensionada con rebaja de renta' },
  { value: 0, label: 'Sin reducción (0%)' },
]

/** Porcentaje sin signo con coma es-ES: '5,38%'. */
const pctPlain = (x: number, decimals = 2) => `${(x * 100).toFixed(decimals).replace('.', ',')}%`

const parseNum = (s: string): number => {
  const n = Number(s.replace(',', '.'))
  return Number.isFinite(n) && n >= 0 ? n : 0
}

function FieldLabel({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="label-caps mb-2 block text-muted">
      {children}
    </label>
  )
}

function Toggle({
  id,
  checked,
  onChange,
  children,
}: {
  id: string
  checked: boolean
  onChange: (v: boolean) => void
  children: React.ReactNode
}) {
  return (
    <label htmlFor={id} className="flex w-fit cursor-pointer items-center gap-3 py-1 select-none">
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="peer sr-only"
      />
      <span
        aria-hidden="true"
        className="relative h-6 w-11 rounded-full bg-ink/20 transition-colors duration-200 after:absolute after:top-0.5 after:left-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow-sm after:transition-transform after:duration-200 peer-checked:bg-petrol peer-checked:after:translate-x-5 peer-focus-visible:ring-2 peer-focus-visible:ring-petrol/40"
      />
      <span className="label-caps text-muted">{children}</span>
    </label>
  )
}

function Tile({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="rounded-card border border-hairline bg-paper p-4">
      <p className="label-caps text-muted">{label}</p>
      <p className={`mt-1 font-display text-xl font-bold tracking-tight tabular-nums ${valueClass ?? 'text-ink'}`}>
        {value}
      </p>
    </div>
  )
}

const SCENARIO_LABELS: Record<ScenarioKind, { label: string; titleClass: string }> = {
  conservador: { label: 'Conservador', titleClass: 'text-error/80' },
  realista: { label: 'Realista', titleClass: 'text-ink' },
  optimista: { label: 'Optimista', titleClass: 'text-success/80' },
}

function ScenarioTile({ kind, cashflow, netYield }: { kind: ScenarioKind; cashflow: number; netYield: number }) {
  const { label, titleClass } = SCENARIO_LABELS[kind]
  const cashflowClass = cashflow >= 0 ? 'text-gold-deep' : 'text-error'
  return (
    <div
      className={`rounded-card border p-4 ${
        kind === 'realista' ? 'border-petrol/30 bg-petrol/5' : 'border-hairline bg-paper'
      }`}
    >
      <p className={`label-caps ${titleClass}`}>{label}</p>
      <p className={`mt-1 font-display text-lg font-bold tracking-tight tabular-nums ${cashflowClass}`}>
        {formatEur(cashflow)}
      </p>
      <p className="mt-0.5 text-xs text-muted tabular-nums">{pctPlain(netYield)} neta</p>
    </div>
  )
}

function BreakdownList({ title, lines }: { title: string; lines: RentabilityLine[] }) {
  if (lines.length === 0) return null
  return (
    <div>
      <p className="label-caps mt-4 mb-1 text-muted">{title}</p>
      {lines.map((line) => (
        <div
          key={line.concept}
          className="flex items-center justify-between gap-4 rounded-lg px-3 py-1.5 transition-colors hover:bg-paper"
        >
          <span className="text-sm text-ink">{line.concept}</span>
          <span className="font-display text-sm font-semibold text-ink tabular-nums">
            {formatEur(line.amount)}
          </span>
        </div>
      ))}
    </div>
  )
}

export function RentabilityCard({
  estimatedValue,
  builtAreaM2,
}: {
  estimatedValue: number
  builtAreaM2?: number | null
}) {
  const uid = useId()
  const [purchasePrice, setPurchasePrice] = useState(() => String(estimatedValue))
  const [monthlyRent, setMonthlyRent] = useState('')
  const [ccaa, setCcaa] = useState<Ccaa>('cataluna')
  const [withMortgage, setWithMortgage] = useState(true)
  const [ltvPct, setLtvPct] = useState('80')
  const [ratePct, setRatePct] = useState('3,0')
  const [years, setYears] = useState('25')
  const [ibi, setIbi] = useState('')
  const [community, setCommunity] = useState('')
  const [insurance, setInsurance] = useState('')
  const [renovationLevel, setRenovationLevel] = useState<RenovationLevel>('ninguna')
  const [renovationAmount, setRenovationAmount] = useState('0')
  const [withIrpf, setWithIrpf] = useState(false)
  const [marginalRate, setMarginalRate] = useState('0.3')
  const [reduction, setReduction] = useState('0.5')

  const handleRenovationLevelChange = (level: RenovationLevel) => {
    setRenovationLevel(level)
    setRenovationAmount(String(estimateRenovation(level, builtAreaM2 ?? 0)))
  }

  const input = useMemo(
    () => ({
      purchasePrice: parseNum(purchasePrice),
      monthlyRent: parseNum(monthlyRent),
      ccaa,
      mortgage: withMortgage
        ? {
            ltv: parseNum(ltvPct) / 100,
            annualRate: parseNum(ratePct) / 100,
            years: Math.max(1, Math.round(parseNum(years))),
          }
        : undefined,
      annualCosts: {
        ibi: parseNum(ibi) || undefined,
        community: parseNum(community) || undefined,
        insurance: parseNum(insurance) || undefined,
      },
      renovationCost: parseNum(renovationAmount) || undefined,
      irpf: withIrpf
        ? { marginalRate: Number(marginalRate), reduction: Number(reduction) as IrpfReduction }
        : undefined,
    }),
    [
      purchasePrice,
      monthlyRent,
      ccaa,
      withMortgage,
      ltvPct,
      ratePct,
      years,
      ibi,
      community,
      insurance,
      renovationAmount,
      withIrpf,
      marginalRate,
      reduction,
    ],
  )

  const result = useMemo(() => computeRentability(input), [input])
  const scenarios = useMemo(() => computeScenarios(input), [input])

  const cashflow = result.monthlyCashflowAfterTax ?? result.monthlyCashflowPreTax
  const cashflowClass = cashflow >= 0 ? 'text-gold-deep' : 'text-error'

  return (
    <div className="rounded-card border border-hairline bg-white p-6 shadow-ambient">
      <h3 className="font-display text-lg font-semibold text-ink">Rentabilidad como inversión</h3>
      <p className="mt-1 text-sm text-muted">
        Simule la compra a un precio y alquiler dados: impuestos de compra, hipoteca y fiscalidad
        del alquiler incluidos.
      </p>

      {/* Escenario de compra */}
      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <FieldLabel htmlFor={`${uid}-price`}>Precio de compra</FieldLabel>
          <div className="relative">
            <input
              id={`${uid}-price`}
              type="number"
              min={0}
              value={purchasePrice}
              onChange={(e) => setPurchasePrice(e.target.value)}
              className={`${INPUT_CLS} pr-8`}
            />
            <span className="absolute top-1/2 right-4 -translate-y-1/2 text-sm text-muted">€</span>
          </div>
        </div>
        <div>
          <FieldLabel htmlFor={`${uid}-rent`}>Alquiler mensual</FieldLabel>
          <div className="relative">
            <input
              id={`${uid}-rent`}
              type="number"
              min={0}
              placeholder="1.100"
              value={monthlyRent}
              onChange={(e) => setMonthlyRent(e.target.value)}
              className={`${INPUT_CLS} pr-8`}
            />
            <span className="absolute top-1/2 right-4 -translate-y-1/2 text-sm text-muted">€</span>
          </div>
        </div>
        <div>
          <FieldLabel htmlFor={`${uid}-ccaa`}>Comunidad autónoma</FieldLabel>
          <select
            id={`${uid}-ccaa`}
            value={ccaa}
            onChange={(e) => setCcaa(e.target.value as Ccaa)}
            className={INPUT_CLS}
          >
            {(Object.keys(ITP_BY_CCAA) as Ccaa[]).map((key) => (
              <option key={key} value={key}>
                {CCAA_LABELS[key]}
              </option>
            ))}
          </select>
        </div>
      </div>
      <p className="mt-2 flex items-center gap-1.5 text-xs text-muted">
        <Info size={14} aria-hidden="true" />
        Alquiler: estimación manual — el alquiler por zona llegará con SERPAVI.
      </p>

      {/* Hipoteca */}
      <div className="mt-5 border-t border-hairline pt-4">
        <Toggle id={`${uid}-mortgage`} checked={withMortgage} onChange={setWithMortgage}>
          Con hipoteca
        </Toggle>
        {withMortgage && (
          <div className="mt-3 grid grid-cols-3 gap-4">
            <div>
              <FieldLabel htmlFor={`${uid}-ltv`}>Financiación</FieldLabel>
              <div className="relative">
                <input
                  id={`${uid}-ltv`}
                  type="number"
                  min={0}
                  max={100}
                  value={ltvPct}
                  onChange={(e) => setLtvPct(e.target.value)}
                  className={`${INPUT_CLS} pr-8`}
                />
                <span className="absolute top-1/2 right-4 -translate-y-1/2 text-sm text-muted">%</span>
              </div>
            </div>
            <div>
              <FieldLabel htmlFor={`${uid}-rate`}>Interés anual</FieldLabel>
              <div className="relative">
                <input
                  id={`${uid}-rate`}
                  type="text"
                  inputMode="decimal"
                  value={ratePct}
                  onChange={(e) => setRatePct(e.target.value)}
                  className={`${INPUT_CLS} pr-8`}
                />
                <span className="absolute top-1/2 right-4 -translate-y-1/2 text-sm text-muted">%</span>
              </div>
            </div>
            <div>
              <FieldLabel htmlFor={`${uid}-years`}>Plazo</FieldLabel>
              <div className="relative">
                <input
                  id={`${uid}-years`}
                  type="number"
                  min={1}
                  max={40}
                  value={years}
                  onChange={(e) => setYears(e.target.value)}
                  className={`${INPUT_CLS} pr-12`}
                />
                <span className="absolute top-1/2 right-4 -translate-y-1/2 text-sm text-muted">años</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Gastos anuales opcionales */}
      <div className="mt-5 border-t border-hairline pt-4">
        <p className="label-caps text-muted">Gastos anuales (opcional)</p>
        <div className="mt-3 grid grid-cols-3 gap-4">
          {(
            [
              ['IBI', ibi, setIbi],
              ['Comunidad', community, setCommunity],
              ['Seguro', insurance, setInsurance],
            ] as const
          ).map(([label, value, setter]) => (
            <div key={label}>
              <FieldLabel htmlFor={`${uid}-${label}`}>{label}</FieldLabel>
              <div className="relative">
                <input
                  id={`${uid}-${label}`}
                  type="number"
                  min={0}
                  placeholder="0"
                  value={value}
                  onChange={(e) => setter(e.target.value)}
                  className={`${INPUT_CLS} pr-8`}
                />
                <span className="absolute top-1/2 right-4 -translate-y-1/2 text-sm text-muted">€</span>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted">
          Se añade siempre un 10% de la renta como mantenimiento y un 5% de vacancia por defecto.
        </p>
      </div>

      {/* Reforma (P8 — estimación por niveles, iteración 7) */}
      <div className="mt-5 border-t border-hairline pt-4">
        <p className="label-caps text-muted">Reforma (opcional)</p>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel htmlFor={`${uid}-renovation-level`}>Nivel de reforma</FieldLabel>
            <select
              id={`${uid}-renovation-level`}
              value={renovationLevel}
              onChange={(e) => handleRenovationLevelChange(e.target.value as RenovationLevel)}
              className={INPUT_CLS}
            >
              {(Object.keys(RENOVATION_LABELS) as RenovationLevel[]).map((level) => (
                <option key={level} value={level}>
                  {RENOVATION_LABELS[level]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <FieldLabel htmlFor={`${uid}-renovation-amount`}>Importe de reforma</FieldLabel>
            <div className="relative">
              <input
                id={`${uid}-renovation-amount`}
                type="number"
                min={0}
                value={renovationAmount}
                onChange={(e) => setRenovationAmount(e.target.value)}
                className={`${INPUT_CLS} pr-8`}
              />
              <span className="absolute top-1/2 right-4 -translate-y-1/2 text-sm text-muted">€</span>
            </div>
          </div>
        </div>
        <p className="mt-2 flex items-center gap-1.5 text-xs text-muted">
          <Info size={14} aria-hidden="true" />
          {builtAreaM2
            ? 'Estimación v0 por nivel — edítala con tu presupuesto real.'
            : 'Sin superficie del inmueble: estimación v0 en 0 € — importe editable con tu presupuesto real.'}
        </p>
      </div>

      {/* IRPF */}
      <div className="mt-5 border-t border-hairline pt-4">
        <Toggle id={`${uid}-irpf`} checked={withIrpf} onChange={setWithIrpf}>
          Calcular IRPF del alquiler
        </Toggle>
        {withIrpf && (
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel htmlFor={`${uid}-marginal`}>Tipo marginal</FieldLabel>
              <select
                id={`${uid}-marginal`}
                value={marginalRate}
                onChange={(e) => setMarginalRate(e.target.value)}
                className={INPUT_CLS}
              >
                {MARGINAL_RATES.map((r) => (
                  <option key={r} value={String(r)}>
                    {Math.round(r * 100)}%
                  </option>
                ))}
              </select>
            </div>
            <div>
              <FieldLabel htmlFor={`${uid}-reduction`}>Reducción por alquiler de vivienda</FieldLabel>
              <select
                id={`${uid}-reduction`}
                value={reduction}
                onChange={(e) => setReduction(e.target.value)}
                className={INPUT_CLS}
              >
                {IRPF_REDUCTIONS.map((r) => (
                  <option key={r.value} value={String(r.value)}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Resultado */}
      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Tile label="Rentabilidad bruta" value={pctPlain(result.grossYield)} />
        <Tile label="Rentabilidad neta" value={pctPlain(result.netYield)} />
        <Tile
          label="Neta tras impuestos"
          value={result.netYieldAfterTax !== null ? pctPlain(result.netYieldAfterTax) : '—'}
        />
        <Tile
          label={result.monthlyCashflowAfterTax !== null ? 'Cash-flow mensual (tras IRPF)' : 'Cash-flow mensual'}
          value={formatEur(cashflow)}
          valueClass={cashflowClass}
        />
        <Tile
          label="Cuota hipoteca"
          value={result.monthlyMortgagePayment !== null ? `${formatEur(result.monthlyMortgagePayment)}/mes` : '—'}
          valueClass="text-gold-deep"
        />
        <Tile label="Cash invertido" value={formatEur(result.cashInvested)} valueClass="text-gold-deep" />
        <Tile label="Cash-on-cash" value={pctPlain(result.cashOnCash)} />
        <Tile
          label="IRPF anual estimado"
          value={result.irpfAnnualTax !== null ? formatEur(result.irpfAnnualTax) : '—'}
          valueClass={result.irpfAnnualTax !== null ? 'text-gold-deep' : undefined}
        />
      </div>

      {/* Escenarios de inversión (P8-lite, iteración 5) */}
      <div className="mt-6 border-t border-hairline pt-4">
        <p className="label-caps text-muted">Escenarios</p>
        <div className="mt-3 grid grid-cols-3 gap-3">
          {scenarios.map(({ kind, result: scenarioResult }) => (
            <ScenarioTile
              key={kind}
              kind={kind}
              cashflow={scenarioResult.monthlyCashflowAfterTax ?? scenarioResult.monthlyCashflowPreTax}
              netYield={scenarioResult.netYield}
            />
          ))}
        </div>
        <p className="mt-2 text-xs text-muted">
          Supuestos v0: conservador −10% renta y 8% vacancia; optimista +5% renta y 3% vacancia.
        </p>
      </div>

      <details className="group mt-4">
        <summary className="cursor-pointer list-none rounded-lg px-3 py-2 text-sm font-medium text-petrol transition-colors hover:bg-paper">
          <span className="group-open:hidden">Ver desglose línea a línea</span>
          <span className="hidden group-open:inline">Ocultar desglose</span>
        </summary>
        <BreakdownList title="Coste de adquisición" lines={result.acquisitionBreakdown} />
        <BreakdownList title="Gastos operativos anuales" lines={result.operatingBreakdown} />
        <BreakdownList title="IRPF del alquiler (estimación)" lines={result.irpfBreakdown} />
      </details>

      <p className="mt-4 border-t border-hairline pt-3 text-xs text-muted">
        Estimación orientativa con tipos generales v0; ITP y fiscalidad varían según caso —
        verificar con asesor.
      </p>
    </div>
  )
}
