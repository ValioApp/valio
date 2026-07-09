/**
 * Motivo cartográfico del héroe: VARIAS formaciones de curvas de nivel (estilo
 * mapa topográfico / secciones censales) repartidas por todo el ancho del hero.
 * Cada formación es distinta —otro centro, escala, rotación y fase de armónicos—
 * pero todas comparten la MISMA familia (mismos armónicos base, trazo y color),
 * así que se leen como un único mapa. Cuerdas punteadas + nodos las cosen entre sí.
 *
 * Se calcula una sola vez al cargar el módulo, es 100% determinista (sin
 * Math.random) → idéntico en servidor y cliente, sin desajuste de hidratación.
 * La animación de trazado es puramente CSS (`.valio-contour`).
 *
 * Lienzo de referencia: 1600 × 760 (apaisado, se sirve a sangre con slice).
 */

interface Harmonic {
  f: number
  a: number
  p: number
}

// Armónicos base fijos → forma orgánica reproducible. Cada formación los reusa
// con un desfase y una escala de amplitud propios para variar la silueta.
const BASE_HARMONICS: Harmonic[] = [
  { f: 2, a: 0.16, p: 0.7 },
  { f: 3, a: 0.1, p: 2.1 },
  { f: 5, a: 0.055, p: 4.4 },
  { f: 7, a: 0.03, p: 1.2 },
]

const SAMPLES = 72

function radiusAt(theta: number, base: number, harmonics: Harmonic[]): number {
  let r = base
  for (const h of harmonics) r += base * h.a * Math.sin(h.f * theta + h.p)
  return r
}

/** Anillo cerrado (Catmull-Rom → Bézier) para un `base` dado, centrado y rotado. */
function ringPath(
  base: number,
  harmonics: Harmonic[],
  cx: number,
  cy: number,
  rot: number,
): string {
  const pts: Array<[number, number]> = []
  for (let i = 0; i < SAMPLES; i++) {
    const t = (i / SAMPLES) * Math.PI * 2
    const r = radiusAt(t, base, harmonics)
    const a = t + rot
    pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)])
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

interface FormationSpec {
  cx: number
  cy: number
  /** radio del anillo más interno */
  baseStart: number
  /** salto de radio entre anillos */
  step: number
  levels: number
  /** rotación rígida de toda la formación (rad) */
  rot: number
  /** desfase de los armónicos → otra silueta (rad) */
  phase: number
  /** escala de amplitud de armónicos (más = más lobulada) */
  amp: number
  /** multiplicador global de opacidad (profundidad) */
  fade: number
  /** anillo intermedio a resaltar como "cota", o -1 */
  emphasize: number
  /** retardo base de la animación de trazado (s) */
  delay: number
}

/**
 * Cuatro formaciones repartidas por el lienzo apaisado. La principal (derecha,
 * tras la tarjeta) es la más marcada; las demás, más tenues, dan profundidad.
 */
const FORMATIONS: FormationSpec[] = [
  // Principal — derecha, detrás de la tarjeta de valoración.
  { cx: 1200, cy: 380, baseStart: 46, step: 30, levels: 12, rot: 0, phase: 0, amp: 1, fade: 1, emphasize: 6, delay: 0.15 },
  // Izquierda — mediana, más lobulada y girada.
  { cx: 240, cy: 300, baseStart: 40, step: 27, levels: 9, rot: 0.9, phase: 1.7, amp: 1.18, fade: 0.82, emphasize: 4, delay: 0.35 },
  // Inferior centro-izquierda — parcialmente fuera del borde inferior.
  { cx: 640, cy: 720, baseStart: 36, step: 25, levels: 8, rot: 2.1, phase: 3.2, amp: 0.9, fade: 0.7, emphasize: -1, delay: 0.5 },
  // Superior centro — pequeña y muy tenue, arriba.
  { cx: 900, cy: 70, baseStart: 30, step: 22, levels: 6, rot: 1.35, phase: 0.5, amp: 1.06, fade: 0.6, emphasize: -1, delay: 0.6 },
  // Derecha del todo — sangra por el borde para llenar el margen derecho.
  { cx: 1560, cy: 430, baseStart: 34, step: 27, levels: 10, rot: 1.6, phase: 2.4, amp: 1.12, fade: 0.78, emphasize: 5, delay: 0.5 },
]

function buildFormation(s: FormationSpec): Contour[] {
  const harmonics = BASE_HARMONICS.map((h) => ({ f: h.f, a: h.a * s.amp, p: h.p + s.phase }))
  return Array.from({ length: s.levels }, (_, k) => {
    const base = s.baseStart + k * s.step
    const emphasized = k === s.emphasize
    const opacity = (emphasized ? 0.16 : Math.max(0.032, 0.12 - k * 0.006)) * s.fade
    return {
      d: ringPath(base, harmonics, s.cx, s.cy, s.rot),
      opacity: Number(opacity.toFixed(3)),
      width: emphasized ? 1.3 : k % 4 === 0 ? 1.1 : 0.8,
      len: Math.round(2 * Math.PI * base * 1.15),
      delay: Number((s.delay + k * 0.05).toFixed(2)),
    }
  })
}

export const CONTOURS: Contour[] = FORMATIONS.flatMap(buildFormation)

/**
 * Cuerdas tipo límite de sección censal que ATAN las formaciones entre sí
 * (de una a otra), para que el conjunto se lea como un solo mapa.
 */
export const CHORDS: string[] = [
  // izquierda → principal (cruza el centro)
  'M300 250 L620 330 L980 300',
  // principal → inferior
  'M1150 560 L820 600 L560 700',
  // superior → principal
  'M900 150 L1080 250',
  // corta suelta a la izquierda
  'M180 470 L360 430',
]

/** Nodos (vértices de las cuerdas) como puntos de cota, para lectura de mapa. */
export const NODES: Array<[number, number]> = [
  [300, 250],
  [620, 330],
  [980, 300],
  [1150, 560],
  [820, 600],
  [560, 700],
  [900, 150],
  [1080, 250],
  [360, 430],
]
