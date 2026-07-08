import { getTranslations } from 'next-intl/server'

const ITEMS = ['sections', 'income', 'cadastre', 'eco'] as const

/** Franja de datos reales: 4 cifras/fuentes con divisores hairline. */
export async function TrustStrip() {
  const t = await getTranslations('landing.trust')

  return (
    <div className="border-y border-hairline">
      <div className="mx-auto w-full max-w-6xl px-4 md:px-6">
        <div className="flex flex-wrap">
          {ITEMS.map((key, i) => (
            <div
              key={key}
              className={`flex min-w-[44%] flex-1 flex-col gap-1.5 py-5 sm:min-w-[180px] ${
                i === 0 ? 'sm:pl-0' : 'sm:border-l sm:border-hairline sm:pl-6'
              } ${i > 0 ? 'sm:pl-6' : ''}`}
            >
              <span
                data-numeric
                className="font-serif-display text-[15px] font-semibold tracking-tight text-ink tabular-nums"
              >
                {t(`${key}.value`)}
              </span>
              <span className="label-caps text-muted/70">{t(`${key}.label`)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
