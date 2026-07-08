import type { CSSProperties } from 'react'
import { CHORDS, CONTOURS, NODES } from '@/lib/contour-paths'

/**
 * Motivo cartográfico decorativo del héroe (curvas de nivel / sección censal).
 * SVG estático precalculado en `@/lib/contour-paths` (determinista, SSR-safe).
 * El trazado progresivo lo hace CSS (`.valio-contour`). `aria-hidden`.
 */
export function ContourMotif({ className = '' }: { className?: string }) {
  return (
    <div className={`valio-motif pointer-events-none absolute ${className}`} aria-hidden="true">
      <svg
        viewBox="0 0 800 800"
        preserveAspectRatio="xMidYMid meet"
        className="h-full w-full overflow-visible"
      >
        {CONTOURS.map((c, i) => (
          <path
            key={`c-${i}`}
            d={c.d}
            fill="none"
            stroke="var(--color-petrol)"
            strokeWidth={c.width}
            strokeOpacity={c.opacity}
            vectorEffect="non-scaling-stroke"
            className="valio-contour"
            style={
              {
                ['--contour-len']: c.len,
                ['--contour-delay']: `${c.delay}s`,
              } as CSSProperties
            }
          />
        ))}
        {CHORDS.map((d, i) => (
          <path
            key={`chord-${i}`}
            d={d}
            fill="none"
            stroke="var(--color-petrol)"
            strokeWidth={0.8}
            strokeOpacity={0.09}
            strokeDasharray="2 4"
            vectorEffect="non-scaling-stroke"
          />
        ))}
        {NODES.map(([cx, cy], i) => (
          <circle key={`node-${i}`} cx={cx} cy={cy} r={2.6} fill="var(--color-petrol)" fillOpacity={0.18} />
        ))}
      </svg>
    </div>
  )
}
