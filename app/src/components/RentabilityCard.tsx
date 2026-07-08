'use client'

import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Info } from 'lucide-react'
import { computeRentability, type RentabilityConcept, type RentabilityLine } from '@/engine/rentability'
import { ITP_BY_CCAA, type Ccaa, type IrpfReduction } from '@/engine/rentability-rates'
import { estimateRenovation, RENOVATION_LABELS, type RenovationLevel } from '@/engine/renovation'
import { computeScenarios, type ScenarioKind } from '@/engine/scenarios'
import { formatEur, formatPercentPlain } from '@/lib/format'

/**
 * Card interactiva de rentabilidad inversor (iteración 2 del loop).
 * El cálculo es una función pura (engine/rentability) que se recalcula en vivo
 * al editar el escenario. El precio de compra parte del valor estimado pero es
 * editable: un inversor compara "¿y si lo compro a X?".
 */

const INPUT_CLS =
  'w-full rounded-card border border-hairline bg-white px-4 py-2.5 text-base text-ink placeholder:text-muted/50'

const MARGINAL_RATES = [0.19, 0.24, 0.3, 0.37, 0.45, 0.47] as const

/** Reducciones de IRPF por alquiler de vivienda; la etiqueta la resuelve i18n. */
const IRPF_REDUCTIONS: { value: IrpfReduction; key: 'r50' | 'r60' | 'r70' | 'r90' | 'r0' }[] = [
  { value: 0.5, key: 'r50' },
  { value: 0.6, key: 'r60' },
  { value: 0.7, key: 'r70' },
  { value: 0.9, key: 'r90' },
  { value: 0, key: 'r0' },
]

const parseNum = (s: string): number => {
  const n = Number(s.replace(',', '.'))
  return Number.isFinite(n) && n >= 0 ? n : 0
}

type RentabilityT = ReturnType<typeof useTranslations>

/** Etiqueta traducida de un concepto de desglose; los % dinámicos van como parámetro. */
function conceptText(t: RentabilityT, locale: string, c: RentabilityConcept): string {
  switch (c.key) {
    case 'itp':
      return t('concept.itp', { pct: formatPercentPlain(c.pct, locale, { min: 0, max: 1 }) })
    case 'rentReduction':
      return t('concept.rentReduction', { pct: formatPercentPlain(c.pct, locale, { min: 0, max: 0 }) })
    case 'irpfQuota':
      return t('concept.irpfQuota', { rate: formatPercentPlain(c.rate, locale, { min: 0, max: 0 }) })
    default:
      return t(`concept.${c.key}`)
  }
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

const SCENARIO_TITLE_CLASS: Record<ScenarioKind, string> = {
  conservador: 'text-error/80',
  realista: 'text-ink',
  optimista: 'text-success/80',
}

function ScenarioTile({
  kind,
  cashflow,
  netYield,
  t,
  locale,
}: {
  kind: ScenarioKind
  cashflow: number
  netYield: number
  t: RentabilityT
  locale: string
}) {
  const cashflowClass = cashflow >= 0 ? 'text-gold-deep' : 'text-error'
  return (
    <div
      className={`rounded-card border p-4 ${
        kind === 'realista' ? 'border-petrol/30 bg-petrol/5' : 'border-hairline bg-paper'
      }`}
    >
      <p className={`label-caps ${SCENARIO_TITLE_CLASS[kind]}`}>{t(`scenario.${kind}`)}</p>
      <p className={`mt-1 font-display text-lg font-bold tracking-tight tabular-nums ${cashflowClass}`}>
        {formatEur(cashflow, locale)}
      </p>
      <p className="mt-0.5 text-xs text-muted tabular-nums">
        {formatPercentPlain(netYield, locale)} {t('netSuffix')}
      </p>
    </div>
  )
}

function BreakdownList({
  title,
  lines,
  t,
  locale,
}: {
  title: string
  lines: RentabilityLine[]
  t: RentabilityT
  locale: string
}) {
  if (lines.length === 0) return null
  return (
    <div>
      <p className="label-caps mt-4 mb-1 text-muted">{title}</p>
      {lines.map((line) => (
        <div
          key={line.concept.key}
          className="flex items-center justify-between gap-4 rounded-lg px-3 py-1.5 transition-colors hover:bg-paper"
        >
          <span className="text-sm text-ink">{conceptText(t, locale, line.concept)}</span>
          <span className="font-display text-sm font-semibold text-ink tabular-nums">
            {formatEur(line.amount, locale)}
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
  const t = useTranslations('rentability')
  const locale = useLocale()
  const uid = useId()
  const breakdownDetailsRef = useRef<HTMLDetailsElement>(null)
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

  // Informe imprimible (iteración 8): el desglose línea a línea debe salir
  // SIEMPRE abierto en el papel/PDF, sin depender de que el usuario lo haya
  // desplegado en pantalla. Chromium renderiza el contenido de <details>
  // cerrado con `content-visibility: hidden` en un pseudo-elemento interno,
  // que un simple `display: block` en CSS no revierte de forma fiable — por
  // eso se fuerza el atributo `open` nativo justo antes de imprimir y se
  // restaura el estado previo justo después.
  useEffect(() => {
    const el = breakdownDetailsRef.current
    if (!el) return
    let wasOpen = el.open
    const handleBeforePrint = () => {
      wasOpen = el.open
      el.open = true
    }
    const handleAfterPrint = () => {
      el.open = wasOpen
    }
    window.addEventListener('beforeprint', handleBeforePrint)
    window.addEventListener('afterprint', handleAfterPrint)
    return () => {
      window.removeEventListener('beforeprint', handleBeforePrint)
      window.removeEventListener('afterprint', handleAfterPrint)
    }
  }, [])

  const cashflow = result.monthlyCashflowAfterTax ?? result.monthlyCashflowPreTax
  const cashflowClass = cashflow >= 0 ? 'text-gold-deep' : 'text-error'

  return (
    <div className="break-inside-avoid rounded-card border border-hairline bg-white p-6 shadow-ambient">
      <h3 className="font-display text-lg font-semibold text-ink">{t('title')}</h3>
      <p className="mt-1 text-sm text-muted">{t('subtitle')}</p>

      {/* Escenario de compra */}
      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <FieldLabel htmlFor={`${uid}-price`}>{t('purchasePrice')}</FieldLabel>
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
          <FieldLabel htmlFor={`${uid}-rent`}>{t('monthlyRent')}</FieldLabel>
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
          <FieldLabel htmlFor={`${uid}-ccaa`}>{t('ccaaLabel')}</FieldLabel>
          <select
            id={`${uid}-ccaa`}
            value={ccaa}
            onChange={(e) => setCcaa(e.target.value as Ccaa)}
            className={INPUT_CLS}
          >
            {(Object.keys(ITP_BY_CCAA) as Ccaa[]).map((key) => (
              <option key={key} value={key}>
                {t(`ccaa.${key}`)}
              </option>
            ))}
          </select>
        </div>
      </div>
      <p className="mt-2 flex items-center gap-1.5 text-xs text-muted">
        <Info size={14} aria-hidden="true" />
        {t('rentHint')}
      </p>

      {/* Hipoteca */}
      <div className="mt-5 border-t border-hairline pt-4">
        <Toggle id={`${uid}-mortgage`} checked={withMortgage} onChange={setWithMortgage}>
          {t('withMortgage')}
        </Toggle>
        {withMortgage && (
          <div className="mt-3 grid grid-cols-3 gap-4">
            <div>
              <FieldLabel htmlFor={`${uid}-ltv`}>{t('financing')}</FieldLabel>
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
              <FieldLabel htmlFor={`${uid}-rate`}>{t('annualRate')}</FieldLabel>
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
              <FieldLabel htmlFor={`${uid}-years`}>{t('term')}</FieldLabel>
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
                <span className="absolute top-1/2 right-4 -translate-y-1/2 text-sm text-muted">
                  {t('yearsUnit')}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Gastos anuales opcionales */}
      <div className="mt-5 border-t border-hairline pt-4">
        <p className="label-caps text-muted">{t('annualCostsTitle')}</p>
        <div className="mt-3 grid grid-cols-3 gap-4">
          {(
            [
              ['ibi', ibi, setIbi],
              ['community', community, setCommunity],
              ['insurance', insurance, setInsurance],
            ] as const
          ).map(([key, value, setter]) => (
            <div key={key}>
              <FieldLabel htmlFor={`${uid}-${key}`}>{t(key)}</FieldLabel>
              <div className="relative">
                <input
                  id={`${uid}-${key}`}
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
        <p className="mt-2 text-xs text-muted">{t('costsNote')}</p>
      </div>

      {/* Reforma (P8 — estimación por niveles, iteración 7) */}
      <div className="mt-5 border-t border-hairline pt-4">
        <p className="label-caps text-muted">{t('renovationTitle')}</p>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel htmlFor={`${uid}-renovation-level`}>{t('renovationLevel')}</FieldLabel>
            <select
              id={`${uid}-renovation-level`}
              value={renovationLevel}
              onChange={(e) => handleRenovationLevelChange(e.target.value as RenovationLevel)}
              className={INPUT_CLS}
            >
              {(Object.keys(RENOVATION_LABELS) as RenovationLevel[]).map((level) => (
                <option key={level} value={level}>
                  {t(`renov.${level}`)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <FieldLabel htmlFor={`${uid}-renovation-amount`}>{t('renovationAmount')}</FieldLabel>
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
          {builtAreaM2 ? t('renovationHintWithArea') : t('renovationHintNoArea')}
        </p>
      </div>

      {/* IRPF */}
      <div className="mt-5 border-t border-hairline pt-4">
        <Toggle id={`${uid}-irpf`} checked={withIrpf} onChange={setWithIrpf}>
          {t('calcIrpf')}
        </Toggle>
        {withIrpf && (
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel htmlFor={`${uid}-marginal`}>{t('marginalRate')}</FieldLabel>
              <select
                id={`${uid}-marginal`}
                value={marginalRate}
                onChange={(e) => setMarginalRate(e.target.value)}
                className={INPUT_CLS}
              >
                {MARGINAL_RATES.map((r) => (
                  <option key={r} value={String(r)}>
                    {formatPercentPlain(r, locale, { min: 0, max: 0 })}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <FieldLabel htmlFor={`${uid}-reduction`}>{t('rentReductionLabel')}</FieldLabel>
              <select
                id={`${uid}-reduction`}
                value={reduction}
                onChange={(e) => setReduction(e.target.value)}
                className={INPUT_CLS}
              >
                {IRPF_REDUCTIONS.map((r) => (
                  <option key={r.value} value={String(r.value)}>
                    {t(`reduction.${r.key}`)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Resultado */}
      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Tile label={t('tile.grossYield')} value={formatPercentPlain(result.grossYield, locale)} />
        <Tile label={t('tile.netYield')} value={formatPercentPlain(result.netYield, locale)} />
        <Tile
          label={t('tile.netAfterTax')}
          value={result.netYieldAfterTax !== null ? formatPercentPlain(result.netYieldAfterTax, locale) : '—'}
        />
        <Tile
          label={result.monthlyCashflowAfterTax !== null ? t('tile.cashflowAfterTax') : t('tile.cashflow')}
          value={formatEur(cashflow, locale)}
          valueClass={cashflowClass}
        />
        <Tile
          label={t('tile.mortgagePayment')}
          value={
            result.monthlyMortgagePayment !== null
              ? `${formatEur(result.monthlyMortgagePayment, locale)}${t('perMonthSuffix')}`
              : '—'
          }
          valueClass="text-gold-deep"
        />
        <Tile label={t('tile.cashInvested')} value={formatEur(result.cashInvested, locale)} valueClass="text-gold-deep" />
        <Tile label={t('tile.cashOnCash')} value={formatPercentPlain(result.cashOnCash, locale)} />
        <Tile
          label={t('tile.irpfAnnual')}
          value={result.irpfAnnualTax !== null ? formatEur(result.irpfAnnualTax, locale) : '—'}
          valueClass={result.irpfAnnualTax !== null ? 'text-gold-deep' : undefined}
        />
      </div>

      {/* Escenarios de inversión (P8-lite, iteración 5) */}
      <div className="mt-6 border-t border-hairline pt-4">
        <p className="label-caps text-muted">{t('scenariosTitle')}</p>
        <div className="mt-3 grid grid-cols-3 gap-3">
          {scenarios.map(({ kind, result: scenarioResult }) => (
            <ScenarioTile
              key={kind}
              kind={kind}
              cashflow={scenarioResult.monthlyCashflowAfterTax ?? scenarioResult.monthlyCashflowPreTax}
              netYield={scenarioResult.netYield}
              t={t}
              locale={locale}
            />
          ))}
        </div>
        <p className="mt-2 text-xs text-muted">{t('scenariosNote')}</p>
      </div>

      <details ref={breakdownDetailsRef} className="group mt-4">
        <summary className="cursor-pointer list-none rounded-lg px-3 py-2 text-sm font-medium text-petrol transition-colors hover:bg-paper">
          <span className="group-open:hidden">{t('showBreakdown')}</span>
          <span className="hidden group-open:inline">{t('hideBreakdown')}</span>
        </summary>
        <BreakdownList title={t('acquisitionTitle')} lines={result.acquisitionBreakdown} t={t} locale={locale} />
        <BreakdownList title={t('operatingTitle')} lines={result.operatingBreakdown} t={t} locale={locale} />
        <BreakdownList title={t('irpfTitle')} lines={result.irpfBreakdown} t={t} locale={locale} />
      </details>

      <p className="mt-4 border-t border-hairline pt-3 text-xs text-muted">{t('footnote')}</p>
    </div>
  )
}
