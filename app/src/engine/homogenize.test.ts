import { describe, expect, it } from 'vitest'
import { homogenize } from './homogenize'
import type { Comparable, SubjectProperty, ZoneStats } from './types'

const zone = (id: string, incomeCoef: number, negotiationDiscount = 0.06): ZoneStats => ({
  censusSectionId: id,
  municipalityCode: '08019',
  netIncomePerCapita: incomeCoef * 16000,
  municipalityIncomePerCapita: 16000,
  incomeCoef,
  negotiationDiscount,
})

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
  censusSectionId: 'S-SUBJECT',
}

const baseComp: Comparable = {
  id: 'c1',
  kind: 'piso',
  price: 320000, // 4.000 €/m²
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
  censusSectionId: 'S-SUBJECT',
  observedAt: '2026-06-01',
  source: 'socio',
  distanceM: 120,
}

describe('homogenize', () => {
  it('testigo idéntico en la misma zona → sin ajustes, mismo €/m²', () => {
    const r = homogenize(subject, baseComp, zone('S-SUBJECT', 1), zone('S-SUBJECT', 1))
    expect(r.adjustedPricePerM2).toBeCloseTo(4000, 6)
    expect(r.adjustments).toHaveLength(0)
  })

  it('anuncio (no cierre) → descuento de negociación de la zona del testigo', () => {
    const comp = { ...baseComp, isClosingPrice: false }
    const r = homogenize(subject, comp, zone('S-SUBJECT', 1), zone('S-SUBJECT', 1, 0.1))
    expect(r.adjustedPricePerM2).toBeCloseTo(4000 * 0.9, 6)
    // tolerancia: (1-0.1)-1 !== -0.1 exacto en IEEE-754
    const closeAdj = r.adjustments.find((a) => a.concept === 'oferta_a_cierre')
    expect(closeAdj?.pct).toBeCloseTo(-0.1, 6)
  })

  it('subject ocupado vs testigo libre → aplica el descuento de ocupación', () => {
    const occupiedSubject: SubjectProperty = { ...subject, occupancy: 'ocupado' }
    const r = homogenize(occupiedSubject, baseComp, zone('S-SUBJECT', 1), zone('S-SUBJECT', 1))
    // (1 + (-0.40)) / (1 + 0) = 0.60
    expect(r.adjustedPricePerM2).toBeCloseTo(4000 * 0.6, 6)
  })

  it('zona: subject en zona rica (coef 1.6) vs testigo en zona pobre (coef 0.64) → sube (ratio^0.5)', () => {
    const comp = { ...baseComp, censusSectionId: 'S-COMP' }
    const r = homogenize(subject, comp, zone('S-SUBJECT', 1.6), zone('S-COMP', 0.64))
    // (1.6/0.64)^0.5 = 2.5^0.5 ≈ 1.5811
    expect(r.adjustedPricePerM2).toBeCloseTo(4000 * Math.sqrt(2.5), 4)
    const zoneAdj = r.adjustments.find((a) => a.concept === 'renta_zona')
    expect(zoneAdj?.pct).toBeCloseTo(Math.sqrt(2.5) - 1, 4)
  })

  it('antigüedad: se capa a ±10%', () => {
    const comp = { ...baseComp, yearBuilt: 1900 } // 7 décadas → 14% > cap 10%
    const r = homogenize(subject, comp, zone('S-SUBJECT', 1), zone('S-SUBJECT', 1))
    const ageAdj = r.adjustments.find((a) => a.concept === 'antiguedad')
    expect(ageAdj?.pct).toBeCloseTo(0.1, 6)
  })

  it('planta sin ascensor: 4º sin ascensor penaliza -6% frente a 3º con ascensor +3%', () => {
    const comp = { ...baseComp, floor: 4, hasElevator: false }
    const r = homogenize(subject, comp, zone('S-SUBJECT', 1), zone('S-SUBJECT', 1))
    // score subject = +0.03 (3 plantas × 0.01), score comp = -0.06 (3 plantas sobre 1º × -0.02)
    // factor = 1.03 / 0.94
    expect(r.adjustedPricePerM2).toBeCloseTo(4000 * (1.03 / 0.94), 4)
  })

  it('superficie: testigo mayor que el subject → €/m² del subject algo mayor (capado ±8%)', () => {
    const comp = { ...baseComp, builtAreaM2: 200, price: 800000 } // 4.000 €/m²
    const r = homogenize(subject, comp, zone('S-SUBJECT', 1), zone('S-SUBJECT', 1))
    // diff = 200 - 80 = 120 m² → 12% > cap → +8%
    const sizeAdj = r.adjustments.find((a) => a.concept === 'superficie')
    expect(sizeAdj?.pct).toBeCloseTo(0.08, 6)
  })
})
