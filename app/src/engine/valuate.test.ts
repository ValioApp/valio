import { describe, expect, it } from 'vitest'
import { valuate } from './valuate'
import type { Comparable, SubjectProperty, ZoneStats } from './types'

const zones = new Map<string, ZoneStats>([
  ['RAVAL', { censusSectionId: 'RAVAL', municipalityCode: '08019', netIncomePerCapita: 9800, municipalityIncomePerCapita: 16000, incomeCoef: 0.6125, negotiationDiscount: 0.08 }],
  ['SARRIA', { censusSectionId: 'SARRIA', municipalityCode: '08019', netIncomePerCapita: 26500, municipalityIncomePerCapita: 16000, incomeCoef: 1.6562, negotiationDiscount: 0.03 }],
])

const subjectRaval: SubjectProperty = {
  kind: 'piso', builtAreaM2: 75, bedrooms: 3, floor: 2, hasElevator: false,
  yearBuilt: 1950, condition: 'buen_estado', occupancy: 'libre',
  lat: 41.3797, lon: 2.1682, censusSectionId: 'RAVAL',
}

const mkComp = (id: string, over: Partial<Comparable>): Comparable => ({
  id, kind: 'piso', price: 300000, isClosingPrice: false, builtAreaM2: 75,
  bedrooms: 3, floor: 2, hasElevator: false, yearBuilt: 1950,
  condition: 'buen_estado', occupancy: 'libre', lat: 41.3797, lon: 2.1682,
  censusSectionId: 'RAVAL', observedAt: '2026-05-15', source: 'seed', distanceM: 200,
  ...over,
})

const now = new Date('2026-07-07')

describe('valuate (integración)', () => {
  it('valora un piso del Raval con 8 testigos de la zona', () => {
    const candidates = Array.from({ length: 8 }, (_, i) =>
      mkComp(`r${i}`, { price: 290000 + i * 5000, distanceM: 100 + i * 50 }),
    )
    const r = valuate(subjectRaval, candidates, zones, now)
    expect(r.status).toBe('ok')
    if (r.status === 'ok') {
      // anuncios con 8% de descuento de zona: ~3.867 €/m² × 0.92 ≈ 3.560-3.700 €/m²
      expect(r.pricePerM2).toBeGreaterThan(3300)
      expect(r.pricePerM2).toBeLessThan(3900)
      expect(r.comparables.length).toBe(8)
    }
  })

  it('el mismo piso físico vale MÁS si sus testigos vienen de zona rica (factor renta)', () => {
    const ravalComps = Array.from({ length: 8 }, (_, i) => mkComp(`r${i}`, {}))
    const sarriaComps = Array.from({ length: 8 }, (_, i) =>
      mkComp(`s${i}`, { censusSectionId: 'SARRIA' }),
    )
    const withRaval = valuate(subjectRaval, ravalComps, zones, now)
    const subjectSarria = { ...subjectRaval, censusSectionId: 'SARRIA' }
    const withSarria = valuate(subjectSarria, sarriaComps, zones, now)
    if (withRaval.status === 'ok' && withSarria.status === 'ok') {
      // mismos testigos nominales, pero el descuento oferta→cierre de Sarrià (3%) es menor que el del Raval (8%)
      expect(withSarria.pricePerM2).toBeGreaterThan(withRaval.pricePerM2)
    } else {
      throw new Error('ambas valoraciones deberían ser ok')
    }
  })

  it('sin zone_stats del subject → rejected missing_zone_stats', () => {
    const r = valuate({ ...subjectRaval, censusSectionId: 'DESCONOCIDA' }, [], zones, now)
    expect(r.status).toBe('rejected')
    if (r.status === 'rejected') expect(r.reason).toBe('missing_zone_stats')
  })

  it('con 5 candidatos válidos → rejected insufficient_comparables', () => {
    const candidates = Array.from({ length: 5 }, (_, i) => mkComp(`r${i}`, {}))
    const r = valuate(subjectRaval, candidates, zones, now)
    expect(r.status).toBe('rejected')
  })
})
