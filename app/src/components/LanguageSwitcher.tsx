'use client'

import { useTransition } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { setLocale } from '@/i18n/actions'
import { LOCALES, type Locale } from '@/i18n/config'

/**
 * Selector de idioma ES/CA/EN. Segmentado y discreto (label-caps/petrol).
 * Fija la cookie VALIO_LOCALE vía server action y revalida todo el árbol.
 */
export function LanguageSwitcher({ className = '' }: { className?: string }) {
  const active = useLocale() as Locale
  const t = useTranslations('common')
  const [pending, startTransition] = useTransition()

  const onSelect = (locale: Locale) => {
    if (locale === active || pending) return
    startTransition(() => {
      void setLocale(locale)
    })
  }

  return (
    <div
      role="group"
      aria-label={t('languageLabel')}
      className={`inline-flex items-center gap-0.5 rounded-tag border border-hairline bg-white p-0.5 ${
        pending ? 'opacity-60' : ''
      } ${className}`}
    >
      {LOCALES.map((locale) => {
        const isActive = locale === active
        return (
          <button
            key={locale}
            type="button"
            lang={locale}
            aria-pressed={isActive}
            aria-label={t(`${locale}Full`)}
            onClick={() => onSelect(locale)}
            className={`label-caps rounded-[0.25rem] px-2 py-1 transition-colors duration-200 ${
              isActive
                ? 'bg-petrol/10 text-petrol-deep'
                : 'text-muted hover:text-ink'
            }`}
          >
            {t(locale)}
          </button>
        )
      })}
    </div>
  )
}
