import { getTranslations } from 'next-intl/server'
import { ValioWordmark } from '@/components/ValioWordmark'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'

export async function LandingFooter() {
  const t = await getTranslations('landing.footer')

  return (
    <footer className="border-t border-hairline bg-white">
      <div className="mx-auto w-full max-w-6xl px-4 py-12 md:px-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="flex flex-col gap-3">
            <ValioWordmark size="sm" />
            <p className="label-caps text-muted/70">{t('brand')}</p>
          </div>
          <p className="max-w-2xl text-xs leading-relaxed text-muted/80">{t('disclaimer')}</p>
        </div>
        <div className="mt-8 flex flex-col items-start gap-4 border-t border-hairline pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted/60">{t('rights')}</p>
          {/* Selector de idioma también en el footer: en móvil el del header se oculta. */}
          <LanguageSwitcher />
        </div>
      </div>
    </footer>
  )
}
