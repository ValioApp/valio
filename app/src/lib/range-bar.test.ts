import { describe, expect, it } from 'vitest'
import { computeRangeBar } from './range-bar'

describe('computeRangeBar', () => {
  it('sitúa el marcador dentro de la banda para el ejemplo del héroe', () => {
    const { bandLeftPct, bandRightPct, markerLeftPct } = computeRangeBar(246000, 275380, 298000)
    // Banda simétrica en padding: mismos márgenes a ambos lados.
    expect(bandLeftPct).toBeCloseTo(bandRightPct, 1)
    // El marcador cae entre el borde izquierdo y (100 - borde derecho).
    expect(markerLeftPct).toBeGreaterThan(bandLeftPct)
    expect(markerLeftPct).toBeLessThan(100 - bandRightPct)
    // value está por encima del punto medio de la horquilla → marcador > 50%.
    expect(markerLeftPct).toBeGreaterThan(50)
  })

  it('con value en el punto medio deja el marcador centrado', () => {
    const { markerLeftPct } = computeRangeBar(100, 150, 200)
    expect(markerLeftPct).toBeCloseTo(50, 1)
  })

  it('el padding controla el ancho de la banda', () => {
    const tight = computeRangeBar(100, 150, 200, 0)
    // Sin padding, la banda ocupa todo el dominio.
    expect(tight.bandLeftPct).toBeCloseTo(0, 1)
    expect(tight.bandRightPct).toBeCloseTo(0, 1)

    const padded = computeRangeBar(100, 150, 200, 0.25)
    expect(padded.bandLeftPct).toBeGreaterThan(0)
    expect(padded.bandRightPct).toBeGreaterThan(0)
  })

  it('clampa el marcador cuando value queda fuera de la horquilla', () => {
    expect(computeRangeBar(100, 500, 200).markerLeftPct).toBeLessThanOrEqual(100)
    expect(computeRangeBar(100, -100, 200).markerLeftPct).toBeGreaterThanOrEqual(0)
  })

  it('rango degenerado (high <= low) centra el marcador y colapsa la banda', () => {
    expect(computeRangeBar(200, 200, 200)).toEqual({
      bandLeftPct: 0,
      bandRightPct: 0,
      markerLeftPct: 50,
    })
    expect(computeRangeBar(300, 250, 100)).toEqual({
      bandLeftPct: 0,
      bandRightPct: 0,
      markerLeftPct: 50,
    })
  })
})
