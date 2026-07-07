import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowRight, Download, FolderOpen } from 'lucide-react'
import { ConfidencePill } from '@/components/ConfidencePill'
import { formatEur } from '@/lib/format'
import { createClient } from '@/lib/supabase/server'
import { fetchRecentValuations } from '@/lib/valuations'

const KIND_LABELS: Record<string, string> = { piso: 'Piso', casa: 'Casa' }

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export default async function CarteraPage() {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) redirect('/login')

  const rows = await fetchRecentValuations(supabase)

  return (
    <main className="mx-auto w-full max-w-5xl space-y-8 px-4 py-8 md:px-6 md:py-10">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="label-caps text-petrol">Historial</p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight text-ink">
            Cartera
          </h1>
          <p className="mt-2 text-base text-muted">Tus últimas valoraciones orientativas.</p>
        </div>
        {rows.length > 0 && (
          <a
            href="/cartera/export"
            className="flex items-center gap-2 rounded-card border border-hairline bg-white px-4 py-2.5 font-display text-sm font-semibold text-ink transition-colors duration-200 hover:bg-paper"
          >
            <Download size={16} aria-hidden="true" />
            Exportar CSV
          </a>
        )}
      </header>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-card border border-hairline bg-white px-6 py-16 text-center shadow-ambient">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-petrol/10 text-petrol">
            <FolderOpen size={26} aria-hidden="true" />
          </span>
          <div>
            <h2 className="font-display text-xl font-semibold text-ink">
              Valora tu primer inmueble
            </h2>
            <p className="mt-1 max-w-sm text-sm text-muted">
              Aquí aparecerán tus valoraciones con su valor, horquilla y confianza.
            </p>
          </div>
          <Link
            href="/valorar"
            className="mt-2 flex items-center gap-2 rounded-card bg-petrol px-5 py-2.5 font-display text-sm font-semibold text-white transition-colors duration-200 hover:bg-petrol-deep"
          >
            Valorar inmueble
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-card border border-hairline bg-white shadow-ambient">
          <table className="w-full min-w-[560px] text-left">
            <thead>
              <tr className="border-b border-hairline">
                <th className="label-caps px-4 py-3 font-semibold text-muted">Fecha</th>
                <th className="label-caps px-4 py-3 font-semibold text-muted">Tipo</th>
                <th className="label-caps px-4 py-3 text-right font-semibold text-muted">M²</th>
                <th className="label-caps px-4 py-3 text-right font-semibold text-muted">Valor</th>
                <th className="label-caps px-4 py-3 font-semibold text-muted">Confianza</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={row.id} className={i % 2 === 1 ? 'bg-paper' : ''}>
                  <td className="px-4 py-3 font-display text-sm text-muted tabular-nums">
                    {formatDate(row.created_at)}
                  </td>
                  <td className="px-4 py-3 text-sm text-ink">
                    {(row.properties && KIND_LABELS[row.properties.kind]) ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-right font-display text-sm text-ink tabular-nums">
                    {row.properties ? `${row.properties.built_area_m2} m²` : '—'}
                  </td>
                  <td className="px-4 py-3 text-right font-display text-sm font-bold text-gold-deep tabular-nums">
                    {row.outcome.status === 'ok' ? formatEur(row.outcome.value) : '—'}
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
