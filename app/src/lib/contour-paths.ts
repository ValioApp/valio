/**
 * Motivo cartográfico del héroe: curvas de nivel de un ÚNICO campo topográfico.
 *
 * En vez de dibujar varias formas concéntricas sueltas (que se cruzarían y
 * quedarían como formas superpuestas), se define un solo "relieve" continuo —la
 * suma de varias colinas gaussianas repartidas por el lienzo— y se extraen sus
 * isolíneas con marching squares. Las curvas de nivel de un campo continuo NUNCA
 * se cruzan y fluyen alrededor de todas las cimas: el resultado es un conjunto
 * armonioso, con varias elevaciones distintas que pertenecen al mismo mapa.
 *
 * 100% determinista (colinas y niveles fijos, sin Math.random) → idéntico en
 * servidor y cliente, sin desajuste de hidratación. Se calcula una vez al cargar.
 *
 * Lienzo de referencia: 1600 × 760 (apaisado, se sirve a sangre con slice).
 */

const W = 1600
const H = 760
const CELL = 16
const COLS = Math.ceil(W / CELL) // 100
const ROWS = Math.ceil(H / CELL) // 48

interface Peak {
  x: number
  y: number
  amp: number
  sigma: number
}

/** Colinas fijas: cimas distintas repartidas por todo el ancho + una base ancha
 *  que levanta suavemente todo el campo (evita esquinas planas/vacías). */
const PEAKS: Peak[] = [
  { x: 1210, y: 360, amp: 1.0, sigma: 250 }, // principal (derecha, tras la tarjeta)
  { x: 300, y: 320, amp: 0.82, sigma: 210 }, // izquierda
  { x: 1560, y: 470, amp: 0.7, sigma: 210 }, // derecha del todo (llena el margen)
  { x: 720, y: 720, amp: 0.6, sigma: 220 }, // inferior centro
  { x: 900, y: 60, amp: 0.46, sigma: 190 }, // superior centro
  { x: 880, y: 380, amp: 0.3, sigma: 560 }, // base ancha (relieve de fondo)
]

function field(x: number, y: number): number {
  let v = 0
  for (const p of PEAKS) {
    const dx = x - p.x
    const dy = y - p.y
    v += p.amp * Math.exp(-(dx * dx + dy * dy) / (2 * p.sigma * p.sigma))
  }
  return v
}

// Rejilla de valores del campo (esquinas de celda).
const GRID: number[][] = []
for (let i = 0; i <= COLS; i++) {
  const col: number[] = []
  for (let j = 0; j <= ROWS; j++) col.push(field(i * CELL, j * CELL))
  GRID.push(col)
}

/** Interpola el punto de cruce del nivel L en una arista entre dos esquinas. */
function lerp(
  ax: number,
  ay: number,
  av: number,
  bx: number,
  by: number,
  bv: number,
  L: number,
): [number, number] {
  const t = (L - av) / (bv - av)
  return [ax + t * (bx - ax), ay + t * (by - ay)]
}

/** Segmentos de la isolínea de nivel L (marching squares sobre GRID). */
function segmentsAt(L: number): Array<[[number, number], [number, number]]> {
  const segs: Array<[[number, number], [number, number]]> = []
  for (let i = 0; i < COLS; i++) {
    for (let j = 0; j < ROWS; j++) {
      const x0 = i * CELL
      const y0 = j * CELL
      const x1 = x0 + CELL
      const y1 = y0 + CELL
      const tl = GRID[i][j]
      const tr = GRID[i + 1][j]
      const br = GRID[i + 1][j + 1]
      const bl = GRID[i][j + 1]
      const idx = (tl >= L ? 1 : 0) | (tr >= L ? 2 : 0) | (br >= L ? 4 : 0) | (bl >= L ? 8 : 0)
      if (idx === 0 || idx === 15) continue
      const T = () => lerp(x0, y0, tl, x1, y0, tr, L) // arista superior
      const R = () => lerp(x1, y0, tr, x1, y1, br, L) // arista derecha
      const B = () => lerp(x0, y1, bl, x1, y1, br, L) // arista inferior
      const Lf = () => lerp(x0, y0, tl, x0, y1, bl, L) // arista izquierda
      switch (idx) {
        case 1: case 14: segs.push([Lf(), T()]); break
        case 2: case 13: segs.push([T(), R()]); break
        case 3: case 12: segs.push([Lf(), R()]); break
        case 4: case 11: segs.push([R(), B()]); break
        case 6: case 9: segs.push([T(), B()]); break
        case 7: case 8: segs.push([Lf(), B()]); break
        case 5: segs.push([Lf(), T()]); segs.push([R(), B()]); break // silla
        case 10: segs.push([T(), R()]); segs.push([Lf(), B()]); break // silla
      }
    }
  }
  return segs
}

export interface Contour {
  d: string
  opacity: number
  width: number
}

// Niveles fijos: los bajos envuelven todas las colinas (tejido conectivo del
// mapa); los altos son anillos pequeños en cada cima. Uno de cada tres se marca
// un pelín más, como cota principal.
const LEVELS = [0.05, 0.09, 0.14, 0.2, 0.27, 0.35, 0.44, 0.54, 0.65, 0.77, 0.9]

export const CONTOURS: Contour[] = LEVELS.map((L, k) => {
  const segs = segmentsAt(L)
  let d = ''
  for (const [a, b] of segs) {
    d += `M${a[0].toFixed(1)} ${a[1].toFixed(1)}L${b[0].toFixed(1)} ${b[1].toFixed(1)}`
  }
  const major = k % 3 === 0
  return {
    d,
    opacity: major ? 0.11 : 0.06,
    width: major ? 1 : 0.8,
  }
})

/** Puntos de cota en las cimas (menos la base ancha), como detalle de mapa. */
export const NODES: Array<[number, number]> = PEAKS.slice(0, 5).map((p) => [p.x, p.y])
