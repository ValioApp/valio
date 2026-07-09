import type { CSSProperties } from 'react'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { ArrowRight } from 'lucide-react'
import { ContourMotif } from './ContourMotif'
import { HeroValuationCard } from './HeroValuationCard'

const delay = (s: string): CSSProperties => ({ ['--reveal-delay']: s } as CSSProperties)

export async function Hero() {
  const t = await getTranslations('landing.hero')

  return (
    <section className="relative overflow-hidden">
      {/* Motivo cartográfico a sangre: cubre todo el hero (varias formaciones). */}
      <ContourMotif className="inset-0 z-0 h-full w-full" />

      <div className="relative z-[2] mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-y-12 px-4 pt-14 pb-20 md:grid-cols-[1.08fr_0.92fr] md:gap-10 md:px-6 md:pt-20 md:pb-28">
        <div className="max-w-xl">
          <p className="valio-reveal label-caps flex items-center gap-2.5 text-petrol" style={delay('0.05s')}>
            <span className="h-px w-5 bg-gold" aria-hidden="true" />
            {t('eyebrow')}
          </p>

          <h1
            className="valio-reveal font-serif-display mt-6 text-[2.7rem] font-medium leading-[1.03] tracking-tight text-ink sm:text-[3.6rem] lg:text-[4.3rem]"
            style={delay('0.13s')}
          >
            {t('titleLead')}{' '}
            <em className="font-serif-display font-medium italic text-gold-deep">{t('titleAccent')}</em>
          </h1>

          <p
            className="valio-reveal mt-6 max-w-md text-[1.05rem] leading-relaxed text-muted"
            style={delay('0.24s')}
          >
            {t.rich('subtitle', {
              b: (chunks) => <strong className="font-medium text-ink">{chunks}</strong>,
            })}
          </p>

          <div className="valio-reveal mt-9 flex flex-wrap items-center gap-x-4 gap-y-3" style={delay('0.34s')}>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-xl bg-petrol px-6 py-3.5 font-display text-[15px] font-semibold text-white shadow-ambient transition-all duration-200 hover:-translate-y-px hover:bg-petrol-deep active:translate-y-0"
            >
              {t('ctaPrimary')}
            </Link>
            <Link
              href="/demo"
              className="group inline-flex items-center gap-2 px-2 py-2 font-display text-[15px] font-medium text-petrol-deep transition-colors duration-200 hover:text-petrol"
            >
              {t('ctaSecondary')}
              <ArrowRight
                size={16}
                aria-hidden="true"
                className="transition-transform duration-200 group-hover:translate-x-1"
              />
            </Link>
          </div>

          <p className="valio-reveal mt-6 flex items-center gap-2.5 text-[13px] text-muted" style={delay('0.44s')}>
            {t('trustA')}
            <span className="h-1 w-1 rounded-full bg-gold" aria-hidden="true" />
            {t('trustB')}
          </p>
        </div>

        <div className="flex justify-center md:justify-end">
          <HeroValuationCard />
        </div>
      </div>
    </section>
  )
}
