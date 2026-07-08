import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getLocale, getTranslations } from 'next-intl/server'
import { ArrowRight, Download, FolderOpen } from 'lucide-react'
import { ConfidencePill } from '@/components/ConfidencePill'
import { formatEur, formatShortDate } from '@/lib/format'
import { createClient } from '@/lib/supabase/server'
import { fetchRecentValuations } from '@/lib/valuations'

const KIND_KEY: Record<string, 'kindPiso' | 'kindCasa'> = { piso: 'kindPiso', casa: 'kindCasa' }

export default async function CarteraPage() {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) redirect('/login')

  const rows = await fetchRecentValuations(supabase)
  const locale = await getLocale()
  const t = await getTranslations('cartera')
  const tProp = await getTranslations('property')

  return (
    <main className="mx-auto w-full max-w-5xl space-y-8 px-4 py-8 md:px-6 md:py-10">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="label-caps text-petrol">{t('eyebrow')}</p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight text-ink">
            {t('title')}
          </h1>
          <p className="mt-2 text-base text-muted">{t('subtitle')}</p>
        </div>
        {rows.length > 0 && (
          <a
            href="/cartera/export"
            className="flex items-center gap-2 rounded-card border border-hairline bg-white px-4 py-2.5 font-display text-sm font-semibold text-ink transition-colors duration-200 hover:bg-paper"
          >
            <Download size={16} aria-hidden="true" />
            {t('exportCsv')}
          </a>
        )}
      </header>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-card border border-hairline bg-white px-6 py-16 text-center shadow-ambient">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-petrol/10 text-petrol">
            <FolderOpen size={26} aria-hidden="true" />
          </span>
          <div>
            <h2 className="font-display text-xl font-semibold text-ink">{t('emptyTitle')}</h2>
            <p className="mt-1 max-w-sm text-sm text-muted">{t('emptyBody')}</p>
          </div>
          <Link
            href="/valorar"
            className="mt-2 flex items-center gap-2 rounded-card bg-petrol px-5 py-2.5 font-display text-sm font-semibold text-white transition-colors duration-200 hover:bg-petrol-deep"
          >
            {t('emptyCta')}
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-card border border-hairline bg-white shadow-ambient">
          <table className="w-full min-w-[560px] text-left">
            <thead>
              <tr className="border-b border-hairline">
                <th className="label-caps px-4 py-3 font-semibold text-muted">{t('colFecha')}</th>
                <th className="label-caps px-4 py-3 font-semibold text-muted">{t('colTipo')}</th>
                <th className="label-caps px-4 py-3 text-right font-semibold text-muted">{t('colM2')}</th>
                <th className="label-caps px-4 py-3 text-right font-semibold text-muted">{t('colValor')}</th>
                <th className="label-caps px-4 py-3 font-semibold text-muted">{t('colConfianza')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={row.id} className={i % 2 === 1 ? 'bg-paper' : ''}>
                  <td className="px-4 py-3 font-display text-sm text-muted tabular-nums">
                    {formatShortDate(row.created_at, locale)}
                  </td>
                  <td className="px-4 py-3 text-sm text-ink">
                    {row.properties && KIND_KEY[row.properties.kind]
                      ? tProp(KIND_KEY[row.properties.kind])
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-right font-display text-sm text-ink tabular-nums">
                    {row.properties ? `${row.properties.built_area_m2} m²` : '—'}
                  </td>
                  <td className="px-4 py-3 text-right font-display text-sm font-bold text-gold-deep tabular-nums">
                    {row.outcome.status === 'ok' ? formatEur(row.outcome.value, locale) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {row.outcome.status === 'ok' ? (
                      <ConfidencePill level={row.outcome.confidence} />
                    ) : (
                      <span className="text-sm text-muted">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  )
}
