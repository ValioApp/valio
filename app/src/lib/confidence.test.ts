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
    expect(r.reasons[0]).toBe('12 testigos comparables, 3 con precio de cierre real')
    expect(r.reasons[1]).toContain('5,0%')
  })

  it('media por nº de testigos → el hint pide llegar a 10', () => {
    const r = explainConfidence('media', 0.05, mk(8, 0))
    expect(r.nextLevelHint).toBe('Para confianza alta haría falta al menos 10 testigos (hay 8).')
    expect(r.reasons[0]).toBe('8 testigos comparables, todos precios de anuncio')
  })

  it('media por dispersión → el hint pide bajar del 13%', () => {
    const r = explainConfidence('media', 0.18, mk(11, 2))
    expect(r.nextLevelHint).toBe(
      'Para confianza alta haría falta dispersión ≤ 13,0% (está en 18,0%).',
    )
  })

  it('media por ambas cosas → el hint las une con "y"', () => {
    const r = explainConfidence('media', 0.15, mk(7, 1))
    expect(r.nextLevelHint).toContain('al menos 10 testigos (hay 7) y dispersión ≤ 13,0%')
  })

  it('baja → aviso de horquilla amplia y hint hacia confianza media', () => {
    const r = explainConfidence('baja', 0.25, mk(7, 0))
    expect(r.reasons).toContain('horquilla amplia: tómala como orientación de zona, no como precio')
    expect(r.nextLevelHint).toBe(
      'Para confianza media haría falta dispersión ≤ 20,0% (está en 25,0%).',
    )
  })
})
