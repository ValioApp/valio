import { cookies } from 'next/headers'
import { getRequestConfig } from 'next-intl/server'
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale } from './config'

/**
 * Request config de next-intl (modo without i18n routing):
 * lee el locale de la cookie VALIO_LOCALE y carga sus mensajes.
 */
export default getRequestConfig(async () => {
  const store = await cookies()
  const candidate = store.get(LOCALE_COOKIE)?.value
  const locale = isLocale(candidate) ? candidate : DEFAULT_LOCALE

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  }
})
