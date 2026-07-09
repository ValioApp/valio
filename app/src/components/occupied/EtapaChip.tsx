'use client'

import { useTranslations } from 'next-intl'
import { etapaToneClass, type OccupiedEtapa } from '@/lib/occupied'

/**
 * Chip de la etapa de ocupación con color por avance del desalojo
 * (verde = cerca de vacío, dorado = intermedio, petróleo = en trámite,
 * rojo = suspendido, neutro = sin dato). Cliente porque resuelve i18n.
 */
export function EtapaChip({ etapa, size = 'sm' }: { etapa: OccupiedEtapa; size?: 'sm' | 'md' }) {
  const t = useTranslations('ocupados')
  const pad = size === 'md' ? 'px-3 py-1 text-xs' : 'px-2.5 py-0.5 text-[11px]'
  return (
    <span
      className={`inline-flex items-center rounded-full border font-display font-semibold tracking-wide whitespace-nowrap ${pad} ${etapaToneClass(etapa)}`}
    >
      {t(`etapa.${etapa}`)}
    </span>
  )
}
