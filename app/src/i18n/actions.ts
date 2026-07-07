'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { LOCALE_COOKIE, isLocale } from './config'

/** Cambia el idioma de la UI: fija la cookie VALIO_LOCALE y revalida todo. */
export async function setLocale(locale: string): Promise<void> {
  if (!isLocale(locale)) return

  const store = await cookies()
  store.set(LOCALE_COOKIE, locale, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  })

  revalidatePath('/', 'layout')
}
