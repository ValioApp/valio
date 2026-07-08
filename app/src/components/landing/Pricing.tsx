import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { Check } from 'lucide-react'

const TIERS = ['starter', 'professional', 'agency'] as const

export async function Pricing() {
  const t = await getTranslations('landing.pricing')

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-20 md:px-6 md:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <p className="label-caps text-petrol">{t('eyebrow')}</p>
        <h2 className="font-serif-display mt-3 text-[1.9rem] font-medium leading-tight tracking-tight text-ink md:text-[2.6rem]">
          {t('title')}
        </h2>
        <p className="mt-3 text-muted">{t('subtitle')}</p>
      </div>

      <div className="mx-auto mt-12 grid max-w-5xl items-stretch gap-6 md:grid-cols-3">
        {TIERS.map((tier) => {
          const highlighted = tier === 'professional'
          const features = t.raw(`tiers.${tier}.features`) as string[]
          return (
            <div
              key={tier}
              className={`relative flex flex-col rounded-2xl border p-7 ${
                highlighted
                  ? 'border-petrol bg-petrol text-white shadow-ambient md:-my-2 md:py-9'
                  : 'border-hairline bg-white shadow-ambient'
              }`}
            >
              {highlighted && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gold px-3 py-1 label-caps text-petrol-deep">
                  {t('mostPopular')}
                </span>
              )}
              <p className={`label-caps ${highlighted ? 'text-white/70' : 'text-muted'}`}>
                {t(`tiers.${tier}.name`)}
              </p>
              <div className="mt-4 flex items-baseline gap-1">
                <span
                  data-numeric
                  className={`font-serif-display text-[2.75rem] font-semibold leading-none tracking-tight ${
                    highlighted ? 'text-white' : 'text-petrol-deep'
                  }`}
                >
                  {t(`tiers.${tier}.price`)}
                </span>
                <span className={highlighted ? 'text-white/70' : 'text-muted'}>{t('perMonth')}</span>
              </div>
              <ul className="mt-7 flex-1 space-y-3">
                {features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-sm">
                    <Check
                      size={18}
                      className={`mt-0.5 shrink-0 ${highlighted ? 'text-gold' : 'text-petrol'}`}
                      aria-hidden="true"
                    />
                    <span className={highlighted ? 'text-white/90' : 'text-muted'}>{feature}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className={`mt-8 inline-flex w-full items-center justify-center rounded-xl px-4 py-3 font-display text-sm font-semibold transition-colors duration-200 ${
                  highlighted
                    ? 'bg-gold text-petrol-deep hover:bg-gold-deep hover:text-white'
                    : 'bg-petrol text-white hover:bg-petrol-deep'
                }`}
              >
                {t('cta')}
              </Link>
            </div>
          )
        })}
      </div>
      <p className="mt-6 text-center text-sm text-muted/80">{t('note')}</p>
    </section>
  )
}
