import { ValioWordmark } from '@/components/ValioWordmark'
import type { SubjectSummary } from '@/components/ValuationResult'

const KIND_LABELS: Record<SubjectSummary['kind'], string> = {
  piso: 'Piso',
  casa: 'Casa',
}

const OCCUPANCY_LABELS: Record<SubjectSummary['occupancy'], string> = {
  libre: 'Libre',
  alquilado: 'Alquilado',
  ocupado: 'Ocupado',
}

/**
 * Cabecera del memorándum de valoración imprimible (iteración 8, P6/P13-lite).
 * Solo visible en impresión/exportación a PDF del navegador (`hidden print:block`):
 * en pantalla no ocupa espacio. `date` llega ya formateada desde el cliente
 * (useEffect en la página) para no arrastrar `new Date()` al render de
 * servidor y evitar un hydration mismatch.
 */
export function ReportHeader({
  date,
  subject,
}: {
  date: string
  subject?: SubjectSummary | null
}) {
  return (
    <header className="hidden print:block print:mb-6">
      <div className="flex items-start justify-between gap-4 border-b border-hairline pb-4">
        <ValioWordmark size="md" />
        <p className="text-right font-display text-xs text-muted">{date}</p>
      </div>
      <h1 className="mt-4 font-display text-2xl font-semibold text-ink">
        Memorándum de valoración orientativa
      </h1>
      {subject && (
        <p className="mt-1 text-sm text-muted">
          {KIND_LABELS[subject.kind]}
          {subject.builtAreaM2 !== null && ` · ${subject.builtAreaM2} m²`}
          {subject.bedrooms !== null && ` · ${subject.bedrooms} hab`}
          {` · ${OCCUPANCY_LABELS[subject.occupancy]}`}
        </p>
      )}
      <p className="mt-3 border-t border-hairline pt-2 text-xs text-muted">
        Valoración orientativa. No es una tasación oficial (Orden ECO/805/2003).
      </p>
    </header>
  )
}
