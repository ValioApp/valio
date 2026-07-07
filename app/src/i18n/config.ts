/**
 * Configuración i18n de VALIO — modo SIN routing de URL (cookie-based).
 * El locale se guarda en la cookie VALIO_LOCALE; sin cookie → español.
 */
export const LOCALES = ['es', 'ca', 'en'] as const

export type Locale = (typeof LOCALES)[number]

export const DEFAULT_LOCALE: Locale = 'es'

export const LOCALE_COOKIE = 'VALIO_LOCALE'

export function isLocale(value: string | undefined): value is Locale {
  return LOCALES.includes(value as Locale)
}
