/**
 * Motivo cartográfico del héroe: anillos de contorno anidados (estilo curva de
 * nivel / sección censal) generados con sumas de senos de armónicos FIJOS.
 *
 * Se calcula una sola vez al cargar el módulo, es 100% determinista (sin
 * Math.random) y se sirve como cadenas SVG estáticas — idéntico en servidor y
 * cliente, así que no hay desajuste de hidratación. La animación de trazado es
 * puramente CSS (`.valio-contour`).
 */

interface Harmonic {
  f: number
  a: number
  p: number
}

// Armónicos fijos → forma orgánica, reproducible.
const HARMONICS: Harmonic[] = [
  { f: 2, a: 0.16, p: 0.7 },
  { f: 3, a: 0.1, p: 2.1 },
  { f: 5, a: 0.055, p: 4.4 },
  { f: 7, a: 0.03, p: 1.2 },
]

const CX = 400
const CY = 400
const STEP = 64
const LEVELS = 13

function radiusAt(theta: number, base: number): number {
  let r = base
  for (const h of HARMONICS) r += base * h.a * Math.sin(h.f * theta + h.p)
  return r
}

function contourPath(base: number): string {
  const pts: Array<[number, number]> = []
  for (let i = 0; i < STEP; i++) {
    const t = (i / STEP) * Math.PI * 2
    const r = radiusAt(t, base)
    pts.push([CX + r * Math.cos(t), CY + r * Math.sin(t)])
  }
  // Catmull-Rom → cúbicas de Bézier, cerrada.
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
  /** Un anillo intermedio se marca un pelín más para que se lea como cota. */
  emphasized: boolean
}

export const CONTOURS: Contour[] = Array.from({ length: LEVELS }, (_, k) => {
  const base = 40 + k * 27
  const emphasized = k === 6
  return {
    d: contourPath(base),
    opacity: emphasized ? 0.16 : Math.max(0.038, 0.125 - k * 0.005),
    width: emphasized ? 1.3 : k % 4 === 0 ? 1.1 : 0.8,
    len: Math.round(2 * Math.PI * base * 1.15),
    delay: 0.2 + k * 0.06,
    emphasized,
  }
})

/** Cuerdas rectas tipo límite de sección censal (con nodos en los vértices). */
export const CHORDS: string[] = [
  'M120 250 L360 300 L470 180',
  'M300 640 L430 470 L680 520',
  'M110 470 L250 430',
]

/** Nodos (vértices de las cuerdas) como puntos de cota, para lectura de mapa. */
export const NODES: Array<[number, number]> = [
  [360, 300],
  [470, 180],
  [430, 470],
  [680, 520],
  [250, 430],
]
