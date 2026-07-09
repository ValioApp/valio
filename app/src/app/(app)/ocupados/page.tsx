import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { Building2, ChevronLeft, ChevronRight, SearchX } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { listOccupied, occupiedFacets } from '@/data/occupied'
import { filtersToSearchParams, parseOccupiedParams, totalPages } from '@/lib/occupied'
import { OccupiedFilters } from '@/components/occupied/OccupiedFilters'
import { OccupiedCard } from '@/components/occupied/OccupiedCard'

export const dynamic = 'force-dynamic'

type SearchParams = Promise<Record<string, string | string[] | undefined>>

export default async function OcupadosPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) redirect('/login')

  const { filters, page } = parseOccupiedParams(await searchParams)
  const [{ rows, total }, facets] = await Promise.all([
    listOccupied(supabase, filters, page),
    occupiedFacets(supabase),
  ])
  const t = await getTranslations('ocupados')
  const pages = totalPages(total)

  const pageHref = (target: number) => {
    const qs = filtersToSearchParams(filters, target)
    return qs ? `/ocupados?${qs}` : '/ocupados'
  }

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 md:px-6 md:py-10">
      <header>
        <p className="label-caps text-petrol">{t('eyebrow')}</p>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight text-ink">
          {t('title')}
        </h1>
        <p className="mt-2 max-w-2xl text-base text-muted">{t('subtitle')}</p>
      </header>

      <OccupiedFilters facets={facets} filters={filters} />

      <p className="font-display text-sm font-semibold text-muted tabular-nums">
        {t('resultCount', { count: total })}
      </p>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-card border border-hairline bg-white px-6 py-16 text-center shadow-ambient">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-petrol/10 text-petrol">
            <SearchX size={26} aria-hidden="true" />
          </span>
          <div>
            <h2 className="font-display text-xl font-semibold text-ink">{t('emptyTitle')}</h2>
            <p className="mt-1 max-w-sm text-sm text-muted">{t('emptyBody')}</p>
          </div>
          <Link
            href="/ocupados"
            className="mt-2 inline-flex items-center gap-2 rounded-card bg-petrol px-5 py-2.5 font-display text-sm font-semibold text-white transition-colors duration-200 hover:bg-petrol-deep"
          >
            <Building2 size={16} aria-hidden="true" />
            {t('clear')}
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((property) => (
              <OccupiedCard key={property.id} property={property} />
            ))}
          </div>

          {pages > 1 && (
            <nav
              className="flex items-center justify-center gap-4 pt-2"
              aria-label={t('pageStatus', { page, total: pages })}
            >
              <PageLink href={pageHref(page - 1)} disabled={page <= 1} rel="prev">
                <ChevronLeft size={16} aria-hidden="true" />
                {t('prev')}
              </PageLink>
              <span className="font-display text-sm font-semibold text-muted tabular-nums">
                {t('pageStatus', { page, total: pages })}
              </span>
              <PageLink href={pageHref(page + 1)} disabled={page >= pages} rel="next">
                {t('next')}
                <ChevronRight size={16} aria-hidden="true" />
              </PageLink>
            </nav>
          )}
        </>
      )}
    </main>
  )
}

function PageLink({
  href,
  disabled,
  rel,
  children,
}: {
  href: string
  disabled: boolean
  rel: 'prev' | 'next'
  children: React.ReactNode
}) {
  const cls =
    'inline-flex items-center gap-1.5 rounded-card border border-hairline px-4 py-2 font-display text-sm font-semibold'
  if (disabled) {
    return <span className={`${cls} cursor-not-allowed bg-paper text-muted/40`}>{children}</span>
  }
  return (
    <Link rel={rel} href={href} className={`${cls} bg-white text-ink transition-colors hover:bg-paper`}>
      {children}
    </Link>
  )
}
