import type { CSSProperties } from 'react'
import { CONTOURS, NODES } from '@/lib/contour-paths'

/**
 * Motivo cartográfico decorativo del héroe: una sola forma de anillos de nivel
 * anidados (ver `@/lib/contour-paths`). SVG estático precalculado, determinista
 * y SSR-safe. El trazado progresivo lo hace CSS (`.valio-contour`). `aria-hidden`.
 */
export function ContourMotif({ className = '' }: { className?: string }) {
  return (
    <div className={`valio-motif pointer-events-none absolute ${className}`} aria-hidden="true">
      <svg
        viewBox="0 0 1600 760"
        preserveAspectRatio="xMidYMid slice"
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
        {NODES.map(([cx, cy], i) => (
          <circle key={`node-${i}`} cx={cx} cy={cy} r={3} fill="var(--color-petrol)" fillOpacity={0.16} />
        ))}
      </svg>
    </div>
  )
}
