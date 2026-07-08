import { getTranslations } from 'next-intl/server'
import { BadgeCheck, Coins, KeyRound, MapPinned, type LucideIcon } from 'lucide-react'

const ITEMS = ['zone', 'occupancy', 'witnesses', 'profit'] as const

const ICONS: Record<(typeof ITEMS)[number], LucideIcon> = {
  zone: MapPinned,
  occupancy: KeyRound,
  witnesses: BadgeCheck,
  profit: Coins,
}

/**
 * Features en tratamiento editorial: columna de encabezado + lista de filas
 * con divisores hairline (NO cuatro tarjetas idénticas).
 */
export async function Features() {
  const t = await getTranslations('landing.features')

  return (
    <section className="border-t border-hairline bg-white">
      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-10 px-4 py-20 md:grid-cols-[0.85fr_1.15fr] md:gap-16 md:px-6 md:py-24">
        <div className="md:sticky md:top-24 md:self-start">
          <p className="label-caps text-petrol">{t('eyebrow')}</p>
          <h2 className="font-serif-display mt-3 text-[1.9rem] font-medium leading-tight tracking-tight text-ink md:text-[2.6rem]">
            {t('title')}
          </h2>
          <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-muted">{t('subtitle')}</p>
        </div>

        <div className="divide-y divide-hairline border-t border-hairline">
          {ITEMS.map((key) => {
            const Icon = ICONS[key]
            return (
              <div key={key} className="flex gap-5 py-7 first:pt-0 md:py-8">
                <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-card bg-petrol/10">
                  <Icon size={19} className="text-petrol" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="font-display text-[17px] font-semibold tracking-tight text-ink">
                    {t(`items.${key}.title`)}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{t(`items.${key}.body`)}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
