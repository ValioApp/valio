import { getTranslations } from 'next-intl/server'

const ITEMS = ['closings', 'why', 'honesty'] as const

/** Bloque editorial numerado 01/02/03 — "Lo que los portales no te cuentan". */
export async function PortalesSection() {
  const t = await getTranslations('landing.portals')

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-20 md:px-6 md:py-24">
      <div className="mb-12 flex flex-wrap items-end justify-between gap-8">
        <h2 className="font-serif-display max-w-xl text-[1.9rem] font-medium leading-tight tracking-tight text-ink md:text-[2.6rem]">
          {t('title')} <em className="font-serif-display italic text-gold-deep">{t('titleAccent')}</em>
        </h2>
        <p className="max-w-[280px] pb-1 text-[13.5px] leading-relaxed text-muted">{t('kicker')}</p>
      </div>

      <div className="grid grid-cols-1 gap-px border-y border-hairline bg-hairline md:grid-cols-3">
        {ITEMS.map((key, i) => (
          <div
            key={key}
            className="flex flex-col gap-4 bg-paper p-8 transition-colors duration-300 hover:bg-white"
          >
            <span className="font-serif-display text-5xl font-normal leading-none tracking-tight text-gold-deep tabular-nums">
              0{i + 1}
            </span>
            <span className="h-0.5 w-6 bg-gold" aria-hidden="true" />
            <h3 className="font-display text-[17px] font-semibold leading-snug tracking-tight text-ink">
              {t(`items.${key}.title`)}
            </h3>
            <p className="text-sm leading-relaxed text-muted">{t(`items.${key}.body`)}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
