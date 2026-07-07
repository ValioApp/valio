import { describe, expect, it } from 'vitest'
import { estimateRenovation } from './renovation'

describe('estimateRenovation', () => {
  it('nivel "ninguna" en 80 m² → 0 €', () => {
    expect(estimateRenovation('ninguna', 80)).toBe(0)
  })

  it('nivel "integral" en 80 m² → 56.000 € (700 €/m²)', () => {
    expect(estimateRenovation('integral', 80)).toBe(56_000)
  })

  it('redondea a la centena: "parcial" (400 €/m²) × 73 m² = 29.200 €', () => {
    expect(estimateRenovation('parcial', 73)).toBe(29_200)
  })

  it('superficie 0 → 0 € (sin dato de superficie)', () => {
    expect(estimateRenovation('premium', 0)).toBe(0)
  })

  it('superficie negativa o no finita → 0 €', () => {
    expect(estimateRenovation('lavado', -50)).toBe(0)
    expect(estimateRenovation('lavado', NaN)).toBe(0)
  })
})
