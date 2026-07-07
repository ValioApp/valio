import { describe, expect, it } from 'vitest'
import { analyzeOccupancy } from './occupancy'
import type { AdjustedComparable, Comparable, ValuationOutcome } from '@/engine/types'

type OkOutcome = Extract<ValuationOutcome, { status: 'ok' }>

const mkComp = (occupancyPct: number | null): AdjustedComparable => ({
  comparable: { id: Math.random().toString(36).slice(2) } as Comparable,
  adjustments: occupancyPct === null ? [] : [{ concept: 'ocupacion', pct: occupancyPct }],
  adjustedPricePerM2: 4000,
  weight: 1,
})

const mkOutcome = (value: number, comps: AdjustedComparable[]): OkOutcome => ({
  status: 'ok',
  value,
  low: value * 0.9,
  high: value * 1.1,
  pricePerM2: 3000,
  confidence: 'media',
  fsd: 0.1,
  zoneAdjustmentPct: 0,
  comparables: comps,
})

describe('analyzeOccupancy', () => {
  it('inmueble libre (sin ajustes de ocupación) → null', () => {
    expect(analyzeOccupancy(mkOutcome(300000, [mkComp(null), mkComp(null)]))).toBeNull()
  })

  it('ajuste positivo (subject libre vs testigos ocupados) → null, no aplica', () => {
    expect(analyzeOccupancy(mkOutcome(300000, [mkComp(0.5)]))).toBeNull()
  })

  it('ocupado al -40% → valor libre = value/0.6 y CUMPLE la regla 60-70%', () => {
    const r = analyzeOccupancy(mkOutcome(180000, [mkComp(-0.4), mkComp(-0.4)]))
    expect(r).not.toBeNull()
    expect(r!.freeValue).toBe(300000)
    expect(r!.pctOfFreeValue).toBeCloseTo(0.6, 6)
    expect(r!.withinInvestorRule).toBe(true)
  })

  it('alquilado al -15% → 85% del libre y NO cumple la regla del 70%', () => {
    const r = analyzeOccupancy(mkOutcome(255000, [mkComp(-0.15)]))
    expect(r!.pctOfFreeValue).toBeCloseTo(0.85, 6)
    expect(r!.freeValue).toBe(300000)
    expect(r!.withinInvestorRule).toBe(false)
  })

  it('media de ajustes mixtos: solo cuenta los testigos con ajuste de ocupación', () => {
    const r = analyzeOccupancy(mkOutcome(240000, [mkComp(-0.4), mkComp(-0.2), mkComp(null)]))
    expect(r!.meanAdjustmentPct).toBeCloseTo(-0.3, 6)
    expect(r!.pctOfFreeValue).toBeCloseTo(0.7, 6)
    expect(r!.withinInvestorRule).toBe(true)
  })
})
