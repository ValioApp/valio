import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import {
  ArrowRight,
  BadgeCheck,
  Check,
  ChevronDown,
  Coins,
  KeyRound,
  Layers,
  MapPinned,
  ShieldCheck,
  Users,
} from 'lucide-react'
import { ValioWordmark } from '@/components/ValioWordmark'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { createClient } from '@/lib/supabase/server'

/** Claves estables de contenido (el copy vive en los catálogos i18n). */
const FEATURE_KEYS = ['zone', 'occupancy', 'witnesses', 'profit'] as const
const FEATURE_ICONS = {
  zone: MapPinned,
  occupancy: KeyRound,
  witnesses: BadgeCheck,
  profit: Coins,
} as const

const PORTAL_KEYS = ['closings', 'why', 'honesty'] as const
const PORTAL_ICONS = {
  closings: BadgeCheck,
  why: Layers,
  honesty: ShieldCheck,
} as const

const TIER_KEYS = ['starter', 'professional', 'agency'] as const
const FAQ_KEYS = ['official', 'coverage', 'data', 'leadgen'] as const

const PHOTOS = [
  { src: '/landing/living.png', key: 'living' },
  { src: '/landing/bedroom.png', key: 'bedroom' },
  { src: '/landing/kitchen.png', key: 'kitchen' },
] as const

export default async function LandingPage() {
  const t = await getTranslations('landing')
  const tc = await getTranslations('common')

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="flex min-h-dvh flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-hairline bg-paper/85 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 md:px-6">
          <Link href="/" aria-label="VALIO — inicio">
            <ValioWordmark />
          </Link>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            {user ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-card bg-petrol px-4 py-2 font-display text-sm font-semibold text-white transition-colors duration-200 hover:bg-petrol-deep"
              >
                {tc('goToPanel')}
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center rounded-card border border-hairline bg-white px-4 py-2 font-display text-sm font-semibold text-petrol-deep transition-colors duration-200 hover:border-petrol/40"
              >
                {tc('signIn')}
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto w-full max-w-6xl px-4 pt-16 pb-12 md:px-6 md:pt-24 md:pb-16">
          <div className="mx-auto max-w-3xl text-center">
            <p className="label-caps text-petrol">{t('hero.eyebrow')}</p>
            <h1 className="mt-4 font-display text-4xl font-bold leading-tight tracking-tight text-ink md:text-6xl">
              {t('hero.title')}{' '}
              <span className="text-gold-deep">{t('hero.titleAccent')}</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted">
              {t('hero.subtitle')}
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/login"
                className="inline-flex w-full items-center justify-center gap-2 rounded-card bg-petrol px-6 py-3 font-display text-base font-semibold text-white transition-all duration-200 hover:bg-petrol-deep active:scale-[0.98] sm:w-auto"
              >
                {t('hero.ctaPrimary')}
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
              <Link
                href="/demo"
                className="inline-flex w-full items-center justify-center rounded-card border border-hairline bg-white px-6 py-3 font-display text-base font-semibold text-petrol-deep transition-colors duration-200 hover:border-petrol/40 sm:w-auto"
              >
                {t('hero.ctaSecondary')}
              </Link>
            </div>
          </div>

          {/* Imagen de apoyo */}
          <div className="mx-auto mt-14 max-w-5xl overflow-hidden rounded-sheet border border-hairline bg-white shadow-ambient">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/landing/living.png"
              alt={t('hero.imageAlt')}
              loading="eager"
              className="h-auto w-full object-cover"
            />
          </div>
        </section>

        {/* Features */}
        <section className="mx-auto w-full max-w-6xl px-4 py-16 md:px-6 md:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <p className="label-caps text-petrol">{t('features.eyebrow')}</p>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink md:text-4xl">
              {t('features.title')}
            </h2>
            <p className="mt-3 text-muted">{t('features.subtitle')}</p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURE_KEYS.map((key) => {
              const Icon = FEATURE_ICONS[key]
              return (
                <article
                  key={key}
                  className="flex flex-col rounded-card border border-hairline border-l-2 border-l-gold bg-white p-6 shadow-ambient"
                >
                  <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-card bg-petrol/10">
                    <Icon size={20} className="text-petrol" aria-hidden="true" />
                  </span>
                  <h3 className="font-display text-lg font-semibold tracking-tight text-ink">
                    {t(`features.items.${key}.title`)}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    {t(`features.items.${key}.body`)}
                  </p>
                </article>
              )
            })}
          </div>
        </section>

        {/* Banda de fotos (testigos reales) */}
        <section aria-hidden="true" className="mx-auto w-full max-w-6xl px-4 md:px-6">
          <div className="grid grid-cols-3 gap-3 md:gap-6">
            {PHOTOS.map((photo) => (
              <div
                key={photo.key}
                className="overflow-hidden rounded-card border border-hairline bg-white"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.src}
                  alt=""
                  loading="lazy"
                  className="aspect-[4/3] h-full w-full object-cover"
                />
              </div>
            ))}
          </div>
        </section>

        {/* Lo que los portales no te cuentan */}
        <section className="mx-auto w-full max-w-6xl px-4 py-16 md:px-6 md:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-semibold tracking-tight text-ink md:text-4xl">
              {t('portals.title')}
            </h2>
            <p className="mt-3 text-muted">{t('portals.subtitle')}</p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {PORTAL_KEYS.map((key) => {
              const Icon = PORTAL_ICONS[key]
              return (
                <article key={key} className="rounded-card border border-hairline bg-white p-6 shadow-ambient">
                  <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-card bg-petrol/10">
                    <Icon size={20} className="text-petrol" aria-hidden="true" />
                  </span>
                  <h3 className="font-display text-lg font-semibold tracking-tight text-ink">
                    {t(`portals.items.${key}.title`)}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    {t(`portals.items.${key}.body`)}
                  </p>
                </article>
              )
            })}
          </div>
        </section>

        {/* Pricing */}
        <section className="mx-auto w-full max-w-6xl px-4 py-16 md:px-6 md:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <p className="label-caps text-petrol">{t('pricing.eyebrow')}</p>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink md:text-4xl">
              {t('pricing.title')}
            </h2>
            <p className="mt-3 text-muted">{t('pricing.subtitle')}</p>
          </div>
          <div className="mx-auto mt-12 grid max-w-5xl items-stretch gap-6 md:grid-cols-3">
            {TIER_KEYS.map((tier) => {
              const highlighted = tier === 'professional'
              const features = t.raw(`pricing.tiers.${tier}.features`) as string[]
              return (
                <div
                  key={tier}
                  className={`relative flex flex-col rounded-card border p-6 ${
                    highlighted
                      ? 'border-petrol bg-petrol text-white shadow-ambient md:-my-2 md:py-8'
                      : 'border-hairline bg-white shadow-ambient'
                  }`}
                >
                  {highlighted && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gold px-3 py-1 label-caps text-petrol-deep">
                      {t('pricing.mostPopular')}
                    </span>
                  )}
                  <p className={`label-caps ${highlighted ? 'text-white/70' : 'text-muted'}`}>
                    {t(`pricing.tiers.${tier}.name`)}
                  </p>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span
                      data-numeric
                      className={`font-display text-4xl font-bold tracking-tight ${
                        highlighted ? 'text-white' : 'text-petrol-deep'
                      }`}
                    >
                      {t(`pricing.tiers.${tier}.price`)}
                    </span>
                    <span className={highlighted ? 'text-white/70' : 'text-muted'}>
                      {t('pricing.perMonth')}
                    </span>
                  </div>
                  <ul className="mt-6 flex-1 space-y-3">
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
                    href="/login"
                    className={`mt-8 inline-flex w-full items-center justify-center rounded-card px-4 py-3 font-display text-sm font-semibold transition-colors duration-200 ${
                      highlighted
                        ? 'bg-gold text-petrol-deep hover:bg-gold-deep hover:text-white'
                        : 'bg-petrol text-white hover:bg-petrol-deep'
                    }`}
                  >
                    {t('pricing.cta')}
                  </Link>
                </div>
              )
            })}
          </div>
          <p className="mt-6 text-center text-sm text-muted/80">{t('pricing.note')}</p>
        </section>

        {/* FAQ */}
        <section className="mx-auto w-full max-w-3xl px-4 py-16 md:px-6 md:py-20">
          <h2 className="text-center font-display text-3xl font-semibold tracking-tight text-ink md:text-4xl">
            {t('faq.title')}
          </h2>
          <div className="mt-10 space-y-3">
            {FAQ_KEYS.map((key) => (
              <details
                key={key}
                className="group rounded-card border border-hairline bg-white p-5 shadow-ambient"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display font-semibold text-ink">
                  <span>{t(`faq.items.${key}.q`)}</span>
                  <ChevronDown
                    size={20}
                    className="shrink-0 text-petrol transition-transform duration-200 group-open:rotate-180"
                    aria-hidden="true"
                  />
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  {t(`faq.items.${key}.a`)}
                </p>
              </details>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-hairline bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-12 md:px-6">
          <div className="flex flex-col items-center gap-4 text-center">
            <ValioWordmark size="sm" />
            <p className="mx-auto max-w-3xl text-xs leading-relaxed text-muted/80">
              {t('footer.disclaimer')}
            </p>
            <div className="flex flex-col items-center gap-1 pt-2">
              <p className="label-caps text-muted/70">{t('footer.brand')}</p>
              <p className="text-xs text-muted/60">{t('footer.rights')}</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
