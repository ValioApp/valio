/**
 * Barra de horquilla de valoración: a partir de los valores reales
 * (low / value / high) calcula, como porcentajes, la posición del marcador y
 * los márgenes de la banda sobre un dominio con un pequeño padding visual.
 *
 * Pura y testeable. La maqueta cableaba porcentajes fijos (34% / 26% / 51%);
 * aquí se derivan de las cifras, así el marcador y la banda son coherentes con
 * cualquier horquilla real.
 */
export interface RangeBar {
  /** % desde la izquierda donde empieza la banda (posición de `low`). */
  bandLeftPct: number
  /** % desde la derecha donde termina la banda (posición de `high`). */
  bandRightPct: number
  /** % desde la izquierda donde se sitúa el marcador (posición de `value`). */
  markerLeftPct: number
}

const clamp = (n: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, n))

const round = (n: number): number => Math.round(n * 10) / 10

/**
 * @param padRatio fracción del ancho de la horquilla que se añade como margen
 *   a cada lado del dominio (0.18 = 18%), para que la banda no toque los bordes.
 */
export function computeRangeBar(
  low: number,
  value: number,
  high: number,
  padRatio = 0.18,
): RangeBar {
  // Rango degenerado o inválido: centra el marcador y colapsa la banda.
  if (!(high > low) || !Number.isFinite(low) || !Number.isFinite(high)) {
    return { bandLeftPct: 0, bandRightPct: 0, markerLeftPct: 50 }
  }

  const span = high - low
  const pad = span * padRatio
  const domainMin = low - pad
  const domainMax = high + pad
  const domain = domainMax - domainMin

  const bandLeftPct = ((low - domainMin) / domain) * 100
  const bandRightPct = ((domainMax - high) / domain) * 100
  const markerLeftPct = ((clamp(value, low, high) - domainMin) / domain) * 100

  return {
    bandLeftPct: round(clamp(bandLeftPct, 0, 100)),
    bandRightPct: round(clamp(bandRightPct, 0, 100)),
    markerLeftPct: round(clamp(markerLeftPct, 0, 100)),
  }
}
