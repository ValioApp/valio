import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getLocale, getTranslations } from 'next-intl/server'
import { ArrowLeft, ExternalLink, Info } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getOccupied } from '@/data/occupied'
import { tipoVentaKey } from '@/lib/occupied'
import { formatEur } from '@/lib/format'
import { EtapaChip } from '@/components/occupied/EtapaChip'
import { RentabilityCard } from '@/components/RentabilityCard'

export const dynamic = 'force-dynamic'

type Params = Promise<{ id: string }>

export default async function OcupadoDetailPage({ params }: { params: Params }) {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) redirect('/login')

  const { id } = await params
  const p = await getOccupied(supabase, id)
  const t = await getTranslations('ocupados')
  const locale = await getLocale()

  if (!p) {
    return (
      <main className="mx-auto w-full max-w-2xl px-4 py-16 text-center md:px-6">
        <h1 className="font-display text-2xl font-semibold text-ink">{t('notFoundTitle')}</h1>
        <p className="mt-2 text-muted">{t('notFoundBody')}</p>
        <Link
          href="/ocupados"
          className="mt-6 inline-flex items-center gap-2 rounded-card bg-petrol px-5 py-2.5 font-display text-sm font-semibold text-white transition-colors duration-200 hover:bg-petrol-deep"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          {t('notFoundCta')}
        </Link>
      </main>
    )
  }

  const tipoKey = tipoVentaKey(p.tipoVenta)
  const na = t('noData')
  const areaText = p.superficieM2 !== null ? `${p.superficieM2} m²` : na

  return (
    <main className="mx-auto w-full max-w-4xl space-y-6 px-4 py-8 md:px-6 md:py-10">
      <Link
        href="/ocupados"
        className="inline-flex items-center gap-1.5 font-display text-sm font-semibold text-petrol transition-colors hover:text-petrol-deep"
      >
        <ArrowLeft size={16} aria-hidden="true" />
        {t('back')}
      </Link>

      {/* Cabecera */}
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="label-caps text-petrol">{p.provincia}</p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight text-ink">
            {p.municipio}
          </h1>
          <p className="mt-2 max-w-xl text-base text-muted">{p.direccion}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <EtapaChip etapa={p.ocupacionEtapa} size="md" />
          {tipoKey && (
            <span className="rounded-full border border-hairline bg-paper px-3 py-1 font-display text-xs font-semibold text-muted">
              {t(`tipo.${tipoKey}`)}
            </span>
          )}
        </div>
      </header>

      {/* Precio destacado */}
      <section className="rounded-card border border-hairline bg-white p-6 shadow-ambient">
        <p className="label-caps text-muted">{t('fPvp')}</p>
        <p className="mt-1 font-display text-4xl font-bold tracking-tight text-gold-deep tabular-nums">
          {p.pvp !== null ? formatEur(p.pvp, locale) : na}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-x-4 text-sm text-muted tabular-nums">
          {p.eurM2 !== null && (
            <span>
              {formatEur(p.eurM2, locale)}
              {t('perM2Unit')}
            </span>
          )}
          <span>{areaText}</span>
        </div>
        <p className="mt-3 text-xs text-muted">{t('pvpNote')}</p>
      </section>

      {/* Bloques de datos */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Section title={t('secLocation')}>
          <Row label={t('fDireccion')} value={p.direccion} />
          <Row label={t('fMunicipio')} value={p.municipio} />
          <Row label={t('fProvincia')} value={p.provincia} />
          <Row label={t('fCcaa')} value={p.ccaa} />
          <Row label={t('fCp')} value={p.cp} />
        </Section>

        <Section title={t('secFeatures')}>
          <Row label={t('fSuperficie')} value={areaText} />
          <Row label={t('fDormitorios')} value={p.dormitorios?.toString() ?? na} />
          <Row label={t('fBanos')} value={p.banos?.toString() ?? na} />
          <Row
            label={t('fEurM2')}
            value={p.eurM2 !== null ? `${formatEur(p.eurM2, locale)}${t('perM2Unit')}` : na}
          />
        </Section>

        <Section title={t('secId')}>
          <Row label={t('fId')} value={p.id} mono />
          <Row label={t('fTipoVenta')} value={tipoKey ? t(`tipo.${tipoKey}`) : p.tipoVenta} />
          <Row label={t('fFinca')} value={p.fincaRegistral ?? na} mono />
          <Row label={t('fRefCatastral')} value={p.refCatastral ?? na} mono />
        </Section>

        {/* Estado de ocupación — lo más valioso para el inversor */}
        <Section title={t('secOccupancy')}>
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="label-caps text-muted">{t('occStageTitle')}</span>
              <EtapaChip etapa={p.ocupacionEtapa} />
            </div>
            <p className="text-sm text-ink">{t(`etapaInfo.${p.ocupacionEtapa}`)}</p>
            <div>
              <p className="label-caps text-muted">{t('occRawTitle')}</p>
              <p className="mt-1 text-sm text-ink">{p.ocupacionFaseRaw ?? t('occRawNone')}</p>
            </div>
            <p className="flex items-start gap-1.5 border-t border-hairline pt-3 text-xs text-muted">
              <Info size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
              {t('occInvestorNote')}
            </p>
          </div>
        </Section>
      </div>

      {/* Enlace a la ficha de Aliseda */}
      <a
        href={p.link}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-card border border-hairline bg-white px-4 py-2.5 font-display text-sm font-semibold text-ink transition-colors duration-200 hover:bg-paper"
      >
        <ExternalLink size={16} aria-hidden="true" />
        {t('alisedaLink')}
      </a>

      {/* Análisis de inversión */}
      {p.pvp !== null && (
        <section className="space-y-2">
          <div>
            <h2 className="font-display text-xl font-semibold text-ink">{t('secInvestment')}</h2>
            <p className="mt-1 text-sm text-muted">{t('investmentSubtitle')}</p>
          </div>
          <RentabilityCard estimatedValue={p.pvp} builtAreaM2={p.superficieM2} />
        </section>
      )}

      {/* Disclaimer legal */}
      <aside className="flex items-start gap-3 rounded-card border border-gold/25 bg-gold/5 p-5">
        <Info size={18} className="mt-0.5 shrink-0 text-gold-deep" aria-hidden="true" />
        <div className="space-y-1">
          <p className="label-caps text-gold-deep">{t('disclaimerTitle')}</p>
          <p className="text-sm text-muted">
            {t.rich('disclaimerBody', { b: (chunks) => <strong>{chunks}</strong> })}
          </p>
        </div>
      </aside>
    </main>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-card border border-hairline bg-white p-5 shadow-ambient">
      <h2 className="label-caps mb-3 text-petrol">{title}</h2>
      <dl className="space-y-2">{children}</dl>
    </section>
  )
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className={`text-right text-sm font-medium text-ink ${mono ? 'font-mono tabular-nums' : ''}`}>
        {value}
      </dd>
    </div>
  )
}
