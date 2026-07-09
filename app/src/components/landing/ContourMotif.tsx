import { CONTOURS } from '@/lib/contour-paths'

/**
 * Motivo cartográfico decorativo del héroe: curvas de nivel de una ladera continua
 * (ver `@/lib/contour-paths`) — líneas onduladas paralelas que cubren todo el hero,
 * sin cruces ni huecos. SVG estático precalculado, determinista y SSR-safe. El
 * conjunto se funde con `.valio-motif`. `aria-hidden`.
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
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>
    </div>
  )
}
