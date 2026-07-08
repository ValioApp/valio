import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { ArrowRight } from 'lucide-react'
import { ValioWordmark } from '@/components/ValioWordmark'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'

/**
 * Cabecera de la landing consciente de sesión:
 * - sin sesión → "Iniciar sesión" (/login) + "Crear cuenta" (/signup)
 * - con sesión → "Ir al panel" (/dashboard)
 */
export async function LandingHeader({ hasSession }: { hasSession: boolean }) {
  const t = await getTranslations('common')

  return (
    <header className="relative z-20 border-b border-hairline">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5 md:px-6">
        <Link href="/" aria-label="VALIO — inicio">
          <ValioWordmark />
        </Link>

        <nav className="flex items-center gap-3 md:gap-6">
          <div className="hidden sm:block">
            <LanguageSwitcher />
          </div>

          {hasSession ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-card bg-petrol px-4 py-2.5 font-display text-sm font-semibold text-white shadow-ambient transition-colors duration-200 hover:bg-petrol-deep"
            >
              {t('goToPanel')}
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="hidden rounded-card px-4 py-2.5 font-display text-sm font-medium text-muted transition-colors duration-200 hover:bg-paper hover:text-petrol-deep sm:inline-flex"
              >
                {t('logIn')}
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center rounded-card bg-petrol px-4 py-2.5 font-display text-sm font-semibold text-white shadow-ambient transition-colors duration-200 hover:bg-petrol-deep"
              >
                {t('createAccount')}
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  )
}
