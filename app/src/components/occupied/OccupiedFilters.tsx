'use client'

import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { RotateCcw, Search } from 'lucide-react'
import {
  OCCUPIED_ETAPAS,
  OCCUPIED_ORDERS,
  OCCUPIED_TIPO_VENTA,
  hasActiveFilters,
  type OccupiedFilters as Filters,
  type OccupiedOrderKey,
} from '@/lib/occupied'
import { formatCCAA, formatProvincia } from '@/lib/place-names'
import type { OccupiedFacets } from '@/data/occupied'

const CONTROL =
  'w-full rounded-card border border-hairline bg-white px-3 py-2 text-sm text-ink focus:outline-none'
const LABEL = 'label-caps mb-1.5 block text-muted'

const ORDER_KEYS = Object.keys(OCCUPIED_ORDERS) as OccupiedOrderKey[]

/**
 * Barra de filtros con estado en la URL (searchParams): compartible y leída por
 * el server component. Los selects actualizan al instante; municipio y los
 * rangos numéricos van con debounce (350 ms) para no navegar en cada tecla.
 * Cualquier cambio de filtro resetea la paginación a la página 1.
 */
export function OccupiedFilters({ facets, filters }: { facets: OccupiedFacets; filters: Filters }) {
  const t = useTranslations('ocupados')
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  // Estado local de los campos con debounce, sincronizado con la URL.
  const [municipio, setMunicipio] = useState(filters.municipio ?? '')
  const [pvpMin, setPvpMin] = useState(filters.pvpMin?.toString() ?? '')
  const [pvpMax, setPvpMax] = useState(filters.pvpMax?.toString() ?? '')
  const [supMin, setSupMin] = useState(filters.supMin?.toString() ?? '')
  const [supMax, setSupMax] = useState(filters.supMax?.toString() ?? '')

  useEffect(() => setMunicipio(filters.municipio ?? ''), [filters.municipio])
  useEffect(() => setPvpMin(filters.pvpMin?.toString() ?? ''), [filters.pvpMin])
  useEffect(() => setPvpMax(filters.pvpMax?.toString() ?? ''), [filters.pvpMax])
  useEffect(() => setSupMin(filters.supMin?.toString() ?? ''), [filters.supMin])
  useEffect(() => setSupMax(filters.supMax?.toString() ?? ''), [filters.supMax])

  const push = useCallback(
    (patch: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString())
      for (const [key, value] of Object.entries(patch)) {
        if (value === undefined || value === '') params.delete(key)
        else params.set(key, value)
      }
      params.delete('page') // cualquier cambio de filtro vuelve a la página 1
      const qs = params.toString()
      startTransition(() => router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false }))
    },
    [searchParams, pathname, router],
  )

  // Debounce de los campos de texto/número.
  const debounced = useRef<Record<string, ReturnType<typeof setTimeout>>>({})
  const pushDebounced = useCallback(
    (key: string, value: string) => {
      clearTimeout(debounced.current[key])
      debounced.current[key] = setTimeout(() => push({ [key]: value || undefined }), 350)
    },
    [push],
  )

  const provincias = filters.ccaa
    ? (facets.provinciasByCcaa[filters.ccaa] ?? [])
    : Object.values(facets.provinciasByCcaa)
        .flat()
        .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'es'))

  return (
    <div className="rounded-card border border-hairline bg-white p-4 shadow-ambient md:p-5">
      <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Municipio (debounced) */}
        <div className="sm:col-span-2 lg:col-span-1">
          <label htmlFor="f-municipio" className={LABEL}>
            {t('municipio')}
          </label>
          <div className="relative">
            <Search
              size={15}
              className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted"
              aria-hidden="true"
            />
            <input
              id="f-municipio"
              type="search"
              value={municipio}
              placeholder={t('municipioPlaceholder')}
              onChange={(e) => {
                setMunicipio(e.target.value)
                pushDebounced('municipio', e.target.value)
              }}
              className={`${CONTROL} pl-9`}
            />
          </div>
        </div>

        {/* CCAA — al cambiar limpia provincia */}
        <div>
          <label htmlFor="f-ccaa" className={LABEL}>
            {t('ccaa')}
          </label>
          <select
            id="f-ccaa"
            value={filters.ccaa ?? ''}
            onChange={(e) => push({ ccaa: e.target.value || undefined, provincia: undefined })}
            className={CONTROL}
          >
            <option value="">{t('ccaaAll')}</option>
            {facets.ccaas.map((c) => (
              <option key={c.name} value={c.name}>
                {formatCCAA(c.name)} ({c.count})
              </option>
            ))}
          </select>
        </div>

        {/* Provincia (dependiente de CCAA) */}
        <div>
          <label htmlFor="f-provincia" className={LABEL}>
            {t('provincia')}
          </label>
          <select
            id="f-provincia"
            value={filters.provincia ?? ''}
            onChange={(e) => push({ provincia: e.target.value || undefined })}
            className={CONTROL}
          >
            <option value="">{t('provinciaAll')}</option>
            {provincias.map((p) => (
              <option key={p.name} value={p.name}>
                {formatProvincia(p.name)} ({p.count})
              </option>
            ))}
          </select>
        </div>

        {/* Tipo de venta */}
        <div>
          <label htmlFor="f-tipo" className={LABEL}>
            {t('tipoVenta')}
          </label>
          <select
            id="f-tipo"
            value={filters.tipoVenta ?? ''}
            onChange={(e) => push({ tipoVenta: e.target.value || undefined })}
            className={CONTROL}
          >
            <option value="">{t('tipoVentaAll')}</option>
            {OCCUPIED_TIPO_VENTA.map((tv) => (
              <option key={tv.value} value={tv.value}>
                {t(`tipo.${tv.key}`)}
              </option>
            ))}
          </select>
        </div>

        {/* Etapa de ocupación */}
        <div>
          <label htmlFor="f-etapa" className={LABEL}>
            {t('etapaFilter')}
          </label>
          <select
            id="f-etapa"
            value={filters.etapa ?? ''}
            onChange={(e) => push({ etapa: e.target.value || undefined })}
            className={CONTROL}
          >
            <option value="">{t('etapaAll')}</option>
            {OCCUPIED_ETAPAS.map((etapa) => (
              <option key={etapa} value={etapa}>
                {t(`etapa.${etapa}`)}
              </option>
            ))}
          </select>
        </div>

        {/* Rango de precio */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label htmlFor="f-pvpmin" className={LABEL}>
              {t('pvpMin')}
            </label>
            <input
              id="f-pvpmin"
              type="number"
              min={0}
              inputMode="numeric"
              value={pvpMin}
              onChange={(e) => {
                setPvpMin(e.target.value)
                pushDebounced('pvpMin', e.target.value)
              }}
              className={CONTROL}
            />
          </div>
          <div>
            <label htmlFor="f-pvpmax" className={LABEL}>
              {t('pvpMax')}
            </label>
            <input
              id="f-pvpmax"
              type="number"
              min={0}
              inputMode="numeric"
              value={pvpMax}
              onChange={(e) => {
                setPvpMax(e.target.value)
                pushDebounced('pvpMax', e.target.value)
              }}
              className={CONTROL}
            />
          </div>
        </div>

        {/* Rango de superficie */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label htmlFor="f-supmin" className={LABEL}>
              {t('supMin')}
            </label>
            <input
              id="f-supmin"
              type="number"
              min={0}
              inputMode="numeric"
              value={supMin}
              onChange={(e) => {
                setSupMin(e.target.value)
                pushDebounced('supMin', e.target.value)
              }}
              className={CONTROL}
            />
          </div>
          <div>
            <label htmlFor="f-supmax" className={LABEL}>
              {t('supMax')}
            </label>
            <input
              id="f-supmax"
              type="number"
              min={0}
              inputMode="numeric"
              value={supMax}
              onChange={(e) => {
                setSupMax(e.target.value)
                pushDebounced('supMax', e.target.value)
              }}
              className={CONTROL}
            />
          </div>
        </div>

        {/* Orden */}
        <div>
          <label htmlFor="f-order" className={LABEL}>
            {t('orderByLabel')}
          </label>
          <select
            id="f-order"
            value={filters.orderBy}
            onChange={(e) => push({ orderBy: e.target.value })}
            className={CONTROL}
          >
            {ORDER_KEYS.map((key) => (
              <option key={key} value={key}>
                {t(`order.${key}`)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {hasActiveFilters(filters) && (
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={() => startTransition(() => router.push(pathname, { scroll: false }))}
            className="inline-flex items-center gap-2 rounded-card border border-hairline bg-paper px-4 py-2 font-display text-sm font-semibold text-muted transition-colors duration-200 hover:text-ink"
          >
            <RotateCcw size={15} aria-hidden="true" />
            {t('clear')}
          </button>
        </div>
      )}
    </div>
  )
}
