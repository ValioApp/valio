'use client'

import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { BedDouble, Bath, MapPin, Ruler } from 'lucide-react'
import { formatEur } from '@/lib/format'
import { formatMunicipio, formatProvincia } from '@/lib/place-names'
import { tipoVentaKey } from '@/lib/occupied'
import type { OccupiedProperty } from '@/data/occupied'
import { EtapaChip } from './EtapaChip'

/**
 * Tarjeta del catálogo: municipio + provincia, dirección truncada, chips de
 * tipo de venta y etapa de ocupación, superficie y dorm/baños si hay, PVP en
 * gold-deep y €/m². Enlaza a la ficha. Cliente para resolver i18n/locale.
 */
export function OccupiedCard({ property: p }: { property: OccupiedProperty }) {
  const t = useTranslations('ocupados')
  const locale = useLocale()
  const tipoKey = tipoVentaKey(p.tipoVenta)

  return (
    <Link
      href={`/ocupados/${p.id}`}
      className="group flex flex-col rounded-card border border-hairline bg-white p-5 shadow-ambient transition-colors duration-200 hover:border-petrol/40"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 font-display text-base font-semibold text-ink">
            <MapPin size={15} className="shrink-0 text-petrol" aria-hidden="true" />
            <span className="truncate">{formatMunicipio(p.municipio)}</span>
          </p>
          <p className="mt-0.5 truncate text-sm text-muted">{formatProvincia(p.provincia)}</p>
        </div>
        <EtapaChip etapa={p.ocupacionEtapa} />
      </div>

      <p className="mt-3 line-clamp-2 min-h-[2.5rem] text-sm text-muted">{p.direccion}</p>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink tabular-nums">
        {p.superficieM2 !== null && (
          <span className="inline-flex items-center gap-1">
            <Ruler size={14} className="text-muted" aria-hidden="true" />
            {p.superficieM2} m²
          </span>
        )}
        {p.dormitorios !== null && (
          <span className="inline-flex items-center gap-1">
            <BedDouble size={14} className="text-muted" aria-hidden="true" />
            {p.dormitorios}
          </span>
        )}
        {p.banos !== null && (
          <span className="inline-flex items-center gap-1">
            <Bath size={14} className="text-muted" aria-hidden="true" />
            {p.banos}
          </span>
        )}
      </div>

      <div className="mt-4 flex items-end justify-between gap-2 border-t border-hairline pt-4">
        <div>
          <p className="font-display text-2xl font-bold tracking-tight text-gold-deep tabular-nums">
            {p.pvp !== null ? formatEur(p.pvp, locale) : t('noData')}
          </p>
          {p.eurM2 !== null && (
            <p className="mt-0.5 text-xs text-muted tabular-nums">
              {formatEur(p.eurM2, locale)}
              {t('perM2Unit')}
            </p>
          )}
        </div>
        {tipoKey && (
          <span className="rounded-full border border-hairline bg-paper px-2.5 py-0.5 font-display text-[11px] font-semibold text-muted">
            {t(`tipo.${tipoKey}`)}
          </span>
        )}
      </div>
    </Link>
  )
}
