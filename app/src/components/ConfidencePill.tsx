import { ShieldCheck } from 'lucide-react'
import type { ConfidenceLevel } from '@/engine/types'

const STYLES: Record<ConfidenceLevel, string> = {
  alta: 'border-success/30 bg-success/10 text-success',
  media: 'border-gold-deep/30 bg-gold/15 text-gold-deep',
  baja: 'border-error/30 bg-error/10 text-error',
}

const LABELS: Record<ConfidenceLevel, string> = { alta: 'Alta', media: 'Media', baja: 'Baja' }

/** Pill de confianza: alta=esmeralda, media=ámbar, baja=terracota. */
export function ConfidencePill({ level, withPrefix = false }: { level: ConfidenceLevel; withPrefix?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-display text-xs font-semibold tracking-wide whitespace-nowrap ${STYLES[level]}`}
    >
      <ShieldCheck size={14} aria-hidden="true" />
      {withPrefix ? `Confianza: ${LABELS[level]}` : LABELS[level]}
    </span>
  )
}
