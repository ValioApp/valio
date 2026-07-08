import { describe, expect, it } from 'vitest'
import { explainConfidence } from './confidence'
import type { AdjustedComparable, Comparable } from '@/engine/types'

const mk = (n: number, closings: number): AdjustedComparable[] =>
  Array.from({ length: n }, (_, i) => ({
    comparable: { id: `c${i}`, isClosingPrice: i < closings } as Comparable,
    adjustments: [],
    adjustedPricePerM2: 4000,
    weight: 1,
  }))

describe('explainConfidence', () => {
  it('alta → sin hint de siguiente nivel y razones con nº de testigos y cierres', () => {
    const r = explainConfidence('alta', 0.05, mk(12, 3))
    expect(r.nextLevelHint).toBeNull()
    expect(r.reasons[0]).toEqual({ key: 'comparablesWithClosings', n: 12, closings: 3 })
    expect(r.reasons[1]).toEqual({ key: 'dispersion', fsd: 0.05 })
  })

  it('media por nº de testigos → el hint pide llegar a 10', () => {
    const r = explainConfidence('media', 0.05, mk(8, 0))
    expect(r.nextLevelHint).toEqual({
      targetLevel: 'alta',
      missing: [{ key: 'minComps', required: 10, have: 8 }],
    })
    expect(r.reasons[0]).toEqual({ key: 'comparablesNoClosings', n: 8 })
  })

  it('media por dispersión → el hint pide bajar del 13%', () => {
    const r = explainConfidence('media', 0.18, mk(11, 2))
    expect(r.nextLevelHint).toEqual({
      targetLevel: 'alta',
      missing: [{ key: 'maxDispersion', max: 0.13, current: 0.18 }],
    })
  })

  it('media por ambas cosas → el hint las une (dos tokens missing)', () => {
    const r = explainConfidence('media', 0.15, mk(7, 1))
    expect(r.nextLevelHint?.targetLevel).toBe('alta')
    expect(r.nextLevelHint?.missing).toEqual([
      { key: 'minComps', required: 10, have: 7 },
      { key: 'maxDispersion', max: 0.13, current: 0.15 },
    ])
  })

  it('baja → aviso de horquilla amplia y hint hacia confianza media', () => {
    const r = explainConfidence('baja', 0.25, mk(7, 0))
    expect(r.reasons).toContainEqual({ key: 'wideRange' })
    expect(r.nextLevelHint).toEqual({
      targetLevel: 'media',
      missing: [{ key: 'maxDispersion', max: 0.2, current: 0.25 }],
    })
  })
})
