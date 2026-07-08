'use client'

import { useActionState } from 'react'
import { useTranslations } from 'next-intl'
import { AuthShell } from '@/components/auth/AuthShell'
import { AuthField } from '@/components/auth/AuthField'
import { AuthMessage } from '@/components/auth/AuthMessage'
import type { AuthState } from '@/lib/auth-state'
import { updatePassword } from './actions'

export default function ResetPasswordPage() {
  const t = useTranslations('auth.reset')
  const te = useTranslations('auth.errors')
  const [state, action, pending] = useActionState<AuthState, FormData>(updatePassword, null)

  const errorMessage =
    state?.status === 'error'
      ? state.code === 'validation'
        ? (state.message ?? te('generic'))
        : te(state.code)
      : null

  return (
    <AuthShell title={t('title')} subtitle={t('subtitle')}>
      <form action={action} className="flex flex-col gap-4">
        <AuthField
          id="password"
          name="password"
          type="password"
          label={t('passwordLabel')}
          placeholder={t('passwordPlaceholder')}
          autoComplete="new-password"
          required
          minLength={8}
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
