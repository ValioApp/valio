import { getTranslations } from 'next-intl/server'
import { Plus } from 'lucide-react'

const ITEMS = ['official', 'coverage', 'data', 'leadgen'] as const

export async function Faq() {
  const t = await getTranslations('landing.faq')

  return (
    <section className="border-t border-hairline bg-white">
      <div className="mx-auto w-full max-w-3xl px-4 py-20 md:px-6 md:py-24">
        <h2 className="font-serif-display text-center text-[1.9rem] font-medium tracking-tight text-ink md:text-[2.6rem]">
          {t('title')}
        </h2>
        <div className="mt-10 divide-y divide-hairline border-y border-hairline">
          {ITEMS.map((key) => (
            <details key={key} className="group py-1">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 font-display font-semibold text-ink">
                <span>{t(`items.${key}.q`)}</span>
                <Plus
                  size={20}
                  className="shrink-0 text-petrol transition-transform duration-200 group-open:rotate-45"
                  aria-hidden="true"
                />
              </summary>
              <p className="pb-5 text-sm leading-relaxed text-muted">{t(`items.${key}.a`)}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
