/**
 * Motivo cartográfico del héroe: UNA sola forma topográfica —anillos de nivel
 * anidados de un único relieve orgánico— que cubre todo el ancho del hero.
 *
 * Es un solo sistema concéntrico: cada anillo envuelve al anterior, así que las
 * líneas NUNCA se cruzan y todo pertenece a la misma forma (justo lo que se
 * busca). La silueta orgánica viene de una suma de senos de armónicos fijos;
 * un ligero achatamiento vertical (KY) las hace óvalos anchos que encajan en el
 * hero apaisado. Los anillos exteriores son grandes y llegan a los bordes.
 *
 * 100% determinista (sin Math.random) → idéntico en servidor y cliente, sin
 * desajuste de hidratación. Se calcula una vez al cargar. Trazado progresivo por
 * CSS (`.valio-contour`).
 *
 * Lienzo de referencia: 1600 × 760 (apaisado, se sirve a sangre con slice).
 */

interface Harmonic {
  f: number
  a: number
  p: number
}

// Armónicos fijos → contorno orgánico reproducible (varios lóbulos suaves).
const HARMONICS: Harmonic[] = [
  { f: 2, a: 0.17, p: 0.7 },
  { f: 3, a: 0.11, p: 2.1 },
  { f: 5, a: 0.06, p: 4.4 },
  { f: 7, a: 0.032, p: 1.2 },
]

const CX = 840
const CY = 360
const KY = 0.72 // achatamiento vertical → óvalos anchos
const SAMPLES = 96
const LEVELS = 25
const BASE = 40
const STEP = 40

function radiusAt(theta: number, base: number): number {
  let r = base
  for (const h of HARMONICS) r += base * h.a * Math.sin(h.f * theta + h.p)
  return r
}

/** Anillo cerrado y suave (Catmull-Rom → Bézier) para un radio base dado. */
function ringPath(base: number): string {
  const pts: Array<[number, number]> = []
  for (let i = 0; i < SAMPLES; i++) {
    const t = (i / SAMPLES) * Math.PI * 2
    const r = radiusAt(t, base)
    pts.push([CX + r * Math.cos(t), CY + r * KY * Math.sin(t)])
  }
  let d = ''
  for (let j = 0; j < pts.length; j++) {
    const p0 = pts[(j - 1 + pts.length) % pts.length]
    const p1 = pts[j]
    const p2 = pts[(j + 1) % pts.length]
    const p3 = pts[(j + 2) % pts.length]
    if (j === 0) d += `M${p1[0].toFixed(1)} ${p1[1].toFixed(1)}`
    const c1x = p1[0] + (p2[0] - p0[0]) / 6
    const c1y = p1[1] + (p2[1] - p0[1]) / 6
    const c2x = p2[0] - (p3[0] - p1[0]) / 6
    const c2y = p2[1] - (p3[1] - p1[1]) / 6
    d += `C${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`
  }
  return `${d}Z`
}

export interface Contour {
  d: string
  opacity: number
  width: number
  len: number
  delay: number
}

export const CONTOURS: Contour[] = Array.from({ length: LEVELS }, (_, k) => {
  const base = BASE + k * STEP
  const major = k % 5 === 0
  const meanR = base * (1 + KY) * 0.5
  return {
    d: ringPath(base),
    opacity: major ? 0.12 : Math.max(0.035, 0.095 - k * 0.0028),
    width: major ? 1.1 : 0.8,
    len: Math.round(2 * Math.PI * meanR * 1.05),
    delay: Number((0.12 + k * 0.045).toFixed(2)),
  }
})

/** Un par de puntos de cota sutiles sobre anillos intermedios (detalle de mapa). */
export const NODES: Array<[number, number]> = [
  [CX + 250, CY - 120],
  [CX - 470, CY + 90],
  [CX + 40, CY + 300],
]
