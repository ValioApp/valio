import { CONTOURS, NODES } from '@/lib/contour-paths'

/**
 * Motivo cartográfico decorativo del héroe: curvas de nivel de un único campo
 * topográfico (ver `@/lib/contour-paths`), coherentes y sin cruces. SVG estático
 * precalculado (determinista, SSR-safe). El conjunto se funde con `.valio-motif`.
 * `aria-hidden`.
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
        {NODES.map(([cx, cy], i) => (
          <circle key={`node-${i}`} cx={cx} cy={cy} r={3} fill="var(--color-petrol)" fillOpacity={0.16} />
        ))}
      </svg>
    </div>
  )
}
