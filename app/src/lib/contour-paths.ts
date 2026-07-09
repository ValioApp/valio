/**
 * Motivo cartográfico del héroe: curvas de nivel de una "ladera" continua.
 *
 * En vez de anillos concéntricos (centro denso + esquinas vacías) o varias cimas
 * (que crean collados donde las líneas parecen cruzarse), el relieve es una
 * pendiente suave con ondulación: sus isolíneas son curvas onduladas casi
 * paralelas que recorren TODO el hero de borde a borde, uniformemente repartidas.
 * Al salir de un único campo continuo y monótono no se cruzan nunca y no hay
 * cimas sueltas: todo es el mismo sistema, conectado y sin huecos.
 *
 * Se extraen con marching squares. 100% determinista (sin Math.random) → idéntico
 * en servidor y cliente, sin desajuste de hidratación. Se calcula una vez.
 *
 * Lienzo de referencia: 1600 × 760 (apaisado, se sirve a sangre con slice).
 */

const W = 1600
const H = 760
const CELL = 14
const COLS = Math.ceil(W / CELL)
const ROWS = Math.ceil(H / CELL)

/** Relieve: pendiente dominante (borde a borde) + ondulación orgánica fija. */
function field(x: number, y: number): number {
  return (
    0.85 * x +
    0.5 * y +
    150 * Math.sin(x / 300 + 0.6) +
    95 * Math.sin(y / 210 + x / 900 + 1.4) +
    58 * Math.sin(x / 150 - y / 360 + 2.7)
  )
}

// Rejilla de valores del campo en las esquinas de celda + rango real.
const GRID: number[][] = []
let vmin = Infinity
let vmax = -Infinity
for (let i = 0; i <= COLS; i++) {
  const col: number[] = []
  for (let j = 0; j <= ROWS; j++) {
    const v = field(i * CELL, j * CELL)
    col.push(v)
    if (v < vmin) vmin = v
    if (v > vmax) vmax = v
  }
  GRID.push(col)
}

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

/** Segmentos de la isolínea de nivel L (marching squares). */
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
      const T = (): [number, number] => lerp(x0, y0, tl, x1, y0, tr, L)
      const R = (): [number, number] => lerp(x1, y0, tr, x1, y1, br, L)
      const B = (): [number, number] => lerp(x0, y1, bl, x1, y1, br, L)
      const Lf = (): [number, number] => lerp(x0, y0, tl, x0, y1, bl, L)
      switch (idx) {
        case 1: case 14: segs.push([Lf(), T()]); break
        case 2: case 13: segs.push([T(), R()]); break
        case 3: case 12: segs.push([Lf(), R()]); break
        case 4: case 11: segs.push([R(), B()]); break
        case 6: case 9: segs.push([T(), B()]); break
        case 7: case 8: segs.push([Lf(), B()]); break
        case 5: segs.push([Lf(), T()]); segs.push([R(), B()]); break
        case 10: segs.push([T(), R()]); segs.push([Lf(), B()]); break
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

// Niveles equiespaciados en el rango real del campo → líneas uniformemente
// separadas que cubren todo el lienzo. Una de cada cuatro se marca un pelín más.
const N = 26

export const CONTOURS: Contour[] = Array.from({ length: N }, (_, k) => {
  const L = vmin + ((k + 1) / (N + 1)) * (vmax - vmin)
  const segs = segmentsAt(L)
  let d = ''
  for (const [a, b] of segs) {
    d += `M${a[0].toFixed(1)} ${a[1].toFixed(1)}L${b[0].toFixed(1)} ${b[1].toFixed(1)}`
  }
  const major = k % 4 === 0
  return { d, opacity: major ? 0.11 : 0.06, width: major ? 1 : 0.8 }
})

/** La ladera no tiene cimas: sin puntos de cota. */
export const NODES: Array<[number, number]> = []
