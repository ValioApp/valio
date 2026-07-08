'use client'

/**
 * DEMO sin Supabase: ejecuta el motor real en el navegador con testigos
 * sintéticos del Raval y muestra la pantalla de resultado completa.
 * Solo para revisar el producto antes del setup (Task 11). No persiste nada.
 */

import { useEffect, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { ValuationResult } from '@/components/ValuationResult'
import { valuate } from '@/engine/valuate'
import type { Comparable, OccupancyStatus, SubjectProperty, ZoneStats } from '@/engine/types'
import { formatReportDate } from '@/lib/format'

const OCC_KEY: Record<OccupancyStatus, 'occLibre' | 'occAlquilado' | 'occOcupado'> = {
  libre: 'occLibre',
  alquilado: 'occAlquilado',
  ocupado: 'occOcupado',
}

const DEMO_ZONES = new Map<string, ZoneStats>([
  [
    'SEED-RAVAL',
    {
      censusSectionId: 'SEED-RAVAL',
      municipalityCode: '08019',
      netIncomePerCapita: 9800,
      municipalityIncomePerCapita: 16000,
      incomeCoef: 0.6125,
      negotiationDiscount: 0.08,
    },
  ],
])

type RawComp = Pick<
  Comparable,
  'price' | 'builtAreaM2' | 'bedrooms' | 'floor' | 'isClosingPrice' | 'distanceM' | 'condition' | 'yearBuilt'
>

const RAW_COMPARABLES: RawComp[] = [
  { price: 285000, builtAreaM2: 70, bedrooms: 2, floor: 1, isClosingPrice: false, distanceM: 120, condition: 'buen_estado', yearBuilt: 1930 },
  { price: 310000, builtAreaM2: 78, bedrooms: 3, floor: 3, isClosingPrice: false, distanceM: 210, condition: 'reformado', yearBuilt: 1925 },
  { price: 236000, builtAreaM2: 65, bedrooms: 2, floor: 2, isClosingPrice: true, distanceM: 260, condition: 'buen_estado', yearBuilt: 1940 },
  { price: 355000, builtAreaM2: 90, bedrooms: 3, floor: 4, isClosingPrice: false, distanceM: 340, condition: 'buen_estado', yearBuilt: 1960 },
  { price: 198000, builtAreaM2: 60, bedrooms: 2, floor: 1, isClosingPrice: true, distanceM: 380, condition: 'a_reformar', yearBuilt: 1935 },
  { price: 262000, builtAreaM2: 72, bedrooms: 3, floor: 2, isClosingPrice: false, distanceM: 450, condition: 'buen_estado', yearBuilt: 1930 },
  { price: 340000, builtAreaM2: 85, bedrooms: 3, floor: 5, isClosingPrice: false, distanceM: 520, condition: 'reformado', yearBuilt: 1970 },
  { price: 231000, builtAreaM2: 68, bedrooms: 2, floor: 3, isClosingPrice: true, distanceM: 600, condition: 'buen_estado', yearBuilt: 1928 },
]

const DEMO_COMPARABLES: Comparable[] = RAW_COMPARABLES.map((c, i) => ({
  id: `demo-${i}`,
  kind: 'piso' as const,
  hasElevator: (c.floor ?? 0) >= 4,
  occupancy: 'libre' as const,
  lat: 41.3797,
  lon: 2.1682,
  censusSectionId: 'SEED-RAVAL',
  observedAt: '2026-06-01',
  source: 'demo',
  ...c,
}))

export default function DemoPage() {
  const t = useTranslations('demo')
  const locale = useLocale()
  const [occupancy, setOccupancy] = useState<OccupancyStatus>('libre')
  const [reportDate, setReportDate] = useState('')

  useEffect(() => {
    setReportDate(formatReportDate(new Date(), locale))
  }, [locale])

  const subject: SubjectProperty = {
    kind: 'piso',
    builtAreaM2: 75,
    bedrooms: 3,
    floor: 2,
    hasElevator: false,
    yearBuilt: 1950,
    condition: 'buen_estado',
    occupancy,
    lat: 41.3797,
    lon: 2.1682,
    censusSectionId: 'SEED-RAVAL',
  }

  const outcome = valuate(subject, DEMO_COMPARABLES, DEMO_ZONES, new Date('2026-07-07'))

  return (
    <main className="mx-auto max-w-2xl space-y-6 p-4 md:p-6">
      <div className="print-hidden rounded-card border border-hairline bg-white p-4">
        <p className="label-caps text-petrol">{t('eyebrow')}</p>
        <h1 className="mt-1 font-[family-name:var(--font-geist-sans)] text-xl font-semibold text-ink">
          {t('title')}
        </h1>
        <p className="mt-1 text-sm text-muted">{t('subtitle')}</p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {(['libre', 'alquilado', 'ocupado'] as const).map((o) => (
            <button
              key={o}
              type="button"
              onClick={() => setOccupancy(o)}
              className={`rounded-card border px-3 py-2 text-sm font-medium transition-colors ${
                occupancy === o
                  ? 'border-petrol bg-petrol text-white'
                  : 'border-hairline bg-white text-ink hover:border-petrol/20'
              }`}
            >
              {t(OCC_KEY[o])}
            </button>
          ))}
        </div>
      </div>

      <ValuationResult
        outcome={outcome}
        subject={{ kind: 'piso', builtAreaM2: 75, bedrooms: 3, occupancy }}
        reportDate={reportDate}
      />
    </main>
  )
}
