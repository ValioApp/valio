import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowRight } from 'lucide-react'
import { ConfidencePill } from '@/components/ConfidencePill'
import { formatEur } from '@/lib/format'
import { createClient } from '@/lib/supabase/server'
import { fetchRecentValuations } from '@/lib/valuations'
import type { ConfidenceLevel } from '@/engine/types'

function mostFrequentConfidence(levels: ConfidenceLevel[]): ConfidenceLevel | null {
  if (levels.length === 0) return null
  const counts = new Map<ConfidenceLevel, number>()
  for (const level of levels) counts.set(level, (counts.get(level) ?? 0) + 1)
  let top: ConfidenceLevel = levels[0]
  for (const [level, count] of counts) {
    if (count > (counts.get(top) ?? 0)) top = level
  }
  return top
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) redirect('/login')

  const rows = await fetchRecentValuations(supabase)
  const okOutcomes = rows.flatMap((r) => (r.outcome.status === 'ok' ? [r.outcome] : []))
  const avgValue =
    okOutcomes.length > 0
      ? Math.round(okOutcomes.reduce((sum, o) => sum + o.value, 0) / okOutcomes.length)
      : null
  const topConfidence = mostFrequentConfidence(okOutcomes.map((o) => o.confidence))

  return (
    <main className="mx-auto w-full max-w-5xl space-y-8 px-4 py-8 md:px-6 md:py-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label-caps text-petrol">Resumen</p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight text-ink">
            Dashboard
          </h1>
        </div>
        <Link
          href="/valorar"
          className="flex items-center gap-2 rounded-card bg-petrol px-5 py-2.5 font-display text-sm font-semibold text-white transition-colors duration-200 hover:bg-petrol-deep"
        >
          Valorar inmueble
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-card border border-hairline bg-white p-6 shadow-ambient">
          <p className="label-caps text-muted">Valoraciones</p>
          <p className="mt-2 font-display text-3xl font-semibold text-ink tabular-nums">
            {rows.length}
          </p>
        </div>
        <div className="rounded-card border border-hairline bg-white p-6 shadow-ambient">
          <p className="label-caps text-muted">Valor medio</p>
          <p className="mt-2 font-display text-3xl font-semibold text-gold-deep tabular-nums">
            {avgValue !== null ? formatEur(avgValue) : '—'}
          </p>
        </div>
        <div className="rounded-card border border-hairline bg-white p-6 shadow-ambient">
          <p className="label-caps text-muted">Confianza habitual</p>
          <div className="mt-3">
            {topConfidence ? (
              <ConfidencePill level={topConfidence} />
            ) : (
              <p className="font-display text-3xl font-semibold text-muted">—</p>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
