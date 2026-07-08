/* Banda editorial de fotografías reales de Barcelona (Eixample/Gràcia): fachadas
 * modernistas, tejados con la ciudad al fondo y ramblas de barrio. Aterriza el
 * mensaje "valoramos el mercado que se ve por la ventana", no renders genéricos.
 * Fotos locales en /public/landing → <img> plano con lazy loading. */
/* eslint-disable @next/next/no-img-element */

import { getTranslations } from 'next-intl/server'

// Orden intercalando fachadas, tejados, calle y vista aérea para dar ritmo.
const PHOTOS = [
  { key: 'facadeCorner', src: '/landing/facade-eixample.jpg' },
  { key: 'skyline', src: '/landing/tejados-montjuic.jpg' },
  { key: 'balconies', src: '/landing/facade-balcones.jpg' },
  { key: 'rambla', src: '/landing/rambla.jpg' },
  { key: 'aerial', src: '/landing/eixample-aereo.jpg' },
  { key: 'rooftops', src: '/landing/tejados.jpg' },
] as const

export async function BarrioStrip() {
  const t = await getTranslations('landing.barrio')

  return (
    <section className="border-t border-hairline bg-paper">
      <div className="mx-auto w-full max-w-6xl px-4 py-20 md:px-6 md:py-24">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-xl">
            <p className="label-caps flex items-center gap-2.5 text-petrol">
              <span className="h-px w-5 bg-gold" aria-hidden="true" />
              {t('eyebrow')}
            </p>
            <h2 className="font-serif-display mt-4 text-[1.9rem] font-medium leading-tight tracking-tight text-ink md:text-[2.6rem]">
              {t('title')}
            </h2>
          </div>
          <p className="max-w-[300px] pb-1 text-[13.5px] leading-relaxed text-muted">{t('kicker')}</p>
        </div>

        <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3 md:gap-3">
          {PHOTOS.map(({ key, src }) => (
            <figure
              key={key}
              className="group relative aspect-[4/5] overflow-hidden rounded-card border border-hairline bg-[#f4f3ed]"
            >
              <img
                src={src}
                alt={t(`alt.${key}`)}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
              />
              {/* Velo inferior sutil: cohesión tonal con el papel, sin tapar la foto. */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-ink/15 to-transparent"
              />
            </figure>
          ))}
        </div>

        <p className="mt-5 text-center text-[12.5px] text-muted/70">{t('caption')}</p>
      </div>
    </section>
  )
}
