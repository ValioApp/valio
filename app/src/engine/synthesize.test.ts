import { describe, expect, it } from 'vitest'
import { synthesize, weightedMedian } from './synthesize'
import type { AdjustedComparable, Comparable } from './types'

const mkAdjusted = (pricePerM2: number, weight = 1): AdjustedComparable => ({
  comparable: { id: Math.random().toString(36).slice(2) } as Comparable,
  adjustments: [],
  adjustedPricePerM2: pricePerM2,
  weight,
})

describe('weightedMedian', () => {
  it('mediana simple con pesos iguales', () => {
    expect(weightedMedian([1000, 2000, 3000], [1, 1, 1])).toBe(2000)
  })
  it('un peso dominante arrastra la mediana', () => {
    expect(weightedMedian([1000, 2000, 3000], [10, 1, 1])).toBe(1000)
  })
})

describe('synthesize', () => {
  it('con <6 testigos rehúsa valorar (regla de oro)', () => {
    const r = synthesize(80, Array.from({ length: 5 }, () => mkAdjusted(4000)), 0)
    expect(r.status).toBe('rejected')
    if (r.status === 'rejected') {
      expect(r.reason).toBe('insufficient_comparables')
      expect(r.found).toBe(5)
      expect(r.required).toBe(6)
    }
  })

  it('10 testigos homogéneos → confianza alta y horquilla estrecha', () => {
    const comps = Array.from({ length: 10 }, (_, i) => mkAdjusted(4000 + (i % 2 === 0 ? 100 : -100)))
    const r = synthesize(80, comps, 0.05)
    expect(r.status).toBe('ok')
    if (r.status === 'ok') {
      // mediana ponderada de valores alternos 3900/4100 → cae en uno de los dos
      expect(r.pricePerM2).toBeGreaterThanOrEqual(3900)
      expect(r.pricePerM2).toBeLessThanOrEqual(4100)
      expect(r.value).toBe(r.pricePerM2 * 80)
      expect(r.confidence).toBe('alta')
      expect(r.low).toBeLessThan(r.value)
      expect(r.high).toBeGreaterThan(r.value)
      expect(r.zoneAdjustmentPct).toBe(0.05)
    }
  })

  it('7 testigos dispersos → confianza media o baja, nunca alta', () => {
    const prices = [2800, 3200, 3900, 4100, 4800, 5300, 5900]
    const r = synthesize(80, prices.map((p) => mkAdjusted(p)), 0)
    expect(r.status).toBe('ok')
    if (r.status === 'ok') expect(r.confidence).not.toBe('alta')
  })
})
