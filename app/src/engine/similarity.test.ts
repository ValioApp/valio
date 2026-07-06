import { describe, expect, it } from 'vitest'
import { comparableWeight, selectComparables } from './similarity'
import type { Comparable, SubjectProperty } from './types'

const subject: SubjectProperty = {
  kind: 'piso',
  builtAreaM2: 80,
  bedrooms: 3,
  floor: 3,
  hasElevator: true,
  yearBuilt: 1970,
  condition: 'buen_estado',
  occupancy: 'libre',
  lat: 41.38,
  lon: 2.17,
  censusSectionId: 'S1',
}

const mk = (over: Partial<Comparable>): Comparable => ({
  id: Math.random().toString(36).slice(2),
  kind: 'piso',
  price: 320000,
  isClosingPrice: true,
  builtAreaM2: 80,
  bedrooms: 3,
  floor: 3,
  hasElevator: true,
  yearBuilt: 1970,
  condition: 'buen_estado',
  occupancy: 'libre',
  lat: 41.381,
  lon: 2.171,
  censusSectionId: 'S1',
  observedAt: '2026-06-01',
  source: 'socio',
  distanceM: 100,
  ...over,
})

describe('comparableWeight', () => {
  it('un cierre cercano y del mismo tamaño pesa ~1', () => {
    expect(comparableWeight(subject, mk({ distanceM: 0 }))).toBeCloseTo(1, 2)
  })
  it('a 500 m el peso por distancia cae a la mitad', () => {
    expect(comparableWeight(subject, mk({ distanceM: 500 }))).toBeCloseTo(0.5, 2)
  })
  it('un anuncio pesa 0.8 frente a un cierre', () => {
    const closing = comparableWeight(subject, mk({ distanceM: 0 }))
    const listing = comparableWeight(subject, mk({ distanceM: 0, isClosingPrice: false }))
    expect(listing / closing).toBeCloseTo(0.8, 6)
  })
})

describe('selectComparables', () => {
  const now = new Date('2026-07-07')
  it('excluye tipología distinta, tamaños fuera de ±40% y datos de hace >18 meses', () => {
    const candidates = [
      mk({}), // válido
      mk({ kind: 'casa' }), // fuera: tipología
      mk({ builtAreaM2: 200 }), // fuera: 200 > 80×1.4
      mk({ observedAt: '2024-06-01' }), // fuera: >18 meses
    ]
    const r = selectComparables(subject, candidates, now)
    expect(r).toHaveLength(1)
  })
  it('ordena por peso descendente y corta en 20', () => {
    const candidates = Array.from({ length: 30 }, (_, i) => mk({ distanceM: i * 100 }))
    const r = selectComparables(subject, candidates, now)
    expect(r).toHaveLength(20)
    expect(r[0].distanceM).toBe(0)
  })
})
