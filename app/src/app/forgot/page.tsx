'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { MailCheck } from 'lucide-react'
import { AuthShell } from '@/components/auth/AuthShell'
import { AuthField } from '@/components/auth/AuthField'
import { AuthMessage } from '@/components/auth/AuthMessage'
import type { AuthState } from '@/lib/auth-state'
import { requestPasswordReset } from './actions'

export default function ForgotPage() {
  const t = useTranslations('auth.forgot')
  const te = useTranslations('auth.errors')
  const [state, action, pending] = useActionState<AuthState, FormData>(requestPasswordReset, null)

  if (state?.status === 'sent') {
    return (
      <AuthShell title={t('sentTitle')} subtitle={t('sentBody')}>
        <div className="flex flex-col items-center gap-6 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-petrol/10">
            <MailCheck size={26} className="text-petrol" aria-hidden="true" />
          </span>
          <Link
            href="/login"
            className="font-display text-sm font-semibold text-petrol-deep transition-colors hover:text-petrol"
          >
            {t('backToLogin')}
          </Link>
        </div>
      </AuthShell>
    )
  }

  const errorMessage =
    state?.status === 'error'
      ? state.code === 'validation'
        ? state.message
        : (state.message ?? te('generic'))
      : null

  return (
    <AuthShell
      title={t('title')}
      subtitle={t('subtitle')}
      footer={
        <Link href="/login" className="font-semibold text-petrol-deep transition-colors hover:text-petrol">
          {t('backToLogin')}
        </Link>
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
        {errorMessage && <AuthMessage tone="error">{errorMessage}</AuthMessage>}
        <button
          type="submit"
          disabled={pending}
          className="mt-1 w-full rounded-card bg-petrol px-4 py-3 font-display text-base font-semibold text-white transition-colors duration-200 hover:bg-petrol-deep disabled:opacity-50"
        >
          {pending ? t('submitting') : t('submit')}
        </button>
      </form>
    </AuthShell>
  )
}
