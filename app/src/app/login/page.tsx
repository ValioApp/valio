'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { ChevronDown } from 'lucide-react'
import { AuthShell } from '@/components/auth/AuthShell'
import { AuthField } from '@/components/auth/AuthField'
import { AuthMessage } from '@/components/auth/AuthMessage'
import type { AuthState } from '@/lib/auth-state'
import { sendMagicLink, signInWithPassword } from './actions'

export default function LoginPage() {
  const t = useTranslations('auth.login')
  const te = useTranslations('auth.errors')
  const [state, action, pending] = useActionState<AuthState, FormData>(signInWithPassword, null)
  const [magicState, magicAction, magicPending] = useActionState<AuthState, FormData>(sendMagicLink, null)

  const errorMessage =
    state?.status === 'error'
      ? state.code === 'invalid'
        ? t('invalidCredentials')
        : state.code === 'validation'
          ? state.message
          : (state.message ?? te('generic'))
      : null

  const magicError =
    magicState?.status === 'error'
      ? magicState.code === 'validation'
        ? magicState.message
        : (magicState.message ?? te('generic'))
      : null

  return (
    <AuthShell
      title={t('title')}
      subtitle={t('subtitle')}
      footer={
        <>
          {t('noAccount')}{' '}
          <Link href="/signup" className="font-semibold text-petrol-deep transition-colors hover:text-petrol">
            {t('signupLink')}
          </Link>
        </>
      }
    >
      <form action={action} className="flex flex-col gap-4">
        <AuthField
          id="email"
          name="email"
          type="email"
          label={t('emailLabel')}
          placeholder={t('emailPlaceholder')}
          autoComplete="email"
          required
        />
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label htmlFor="password" className="label-caps text-muted">
              {t('passwordLabel')}
            </label>
            <Link href="/forgot" className="text-xs font-medium text-petrol transition-colors hover:text-petrol-deep">
              {t('forgotLink')}
            </Link>
          </div>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            placeholder={t('passwordPlaceholder')}
            className="w-full rounded-card border border-hairline bg-white px-4 py-3 text-base text-ink placeholder:text-muted/50"
          />
        </div>

        {errorMessage && <AuthMessage tone="error">{errorMessage}</AuthMessage>}

        <button
          type="submit"
          disabled={pending}
          className="mt-1 w-full rounded-card bg-petrol px-4 py-3 font-display text-base font-semibold text-white transition-colors duration-200 hover:bg-petrol-deep disabled:opacity-50"
        >
          {pending ? t('submitting') : t('submit')}
        </button>
      </form>

      {/* Acceso alternativo discreto: enlace mágico */}
      <details className="group mt-6 border-t border-hairline pt-5">
        <summary className="flex cursor-pointer list-none items-center justify-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-petrol-deep">
          {t('magicToggle')}
          <ChevronDown
            size={16}
            className="transition-transform duration-200 group-open:rotate-180"
            aria-hidden="true"
          />
        </summary>
        <form action={magicAction} className="mt-4 flex flex-col gap-3">
          <AuthField
            id="magic-email"
            name="email"
            type="email"
            label={t('emailLabel')}
            placeholder={t('emailPlaceholder')}
            autoComplete="email"
            required
          />
          {magicState?.status === 'sent' ? (
            <AuthMessage tone="success">{t('magicSent')}</AuthMessage>
          ) : (
            magicError && <AuthMessage tone="error">{magicError}</AuthMessage>
          )}
          <button
            type="submit"
            disabled={magicPending}
            className="w-full rounded-card border border-hairline bg-white px-4 py-2.5 font-display text-sm font-semibold text-petrol-deep transition-colors duration-200 hover:border-petrol/40 disabled:opacity-50"
          >
            {magicPending ? t('magicSubmitting') : t('magicSubmit')}
          </button>
        </form>
      </details>
    </AuthShell>
  )
}
