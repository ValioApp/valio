'use client'

import { useActionState } from 'react'
import { AlertCircle, MailCheck } from 'lucide-react'
import { ValioWordmark } from '@/components/ValioWordmark'
import { sendMagicLink } from './actions'

export default function LoginPage() {
  const [state, action, pending] = useActionState(sendMagicLink, null)
  const isSuccess = state?.message.startsWith('Revisa tu correo') ?? false

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 p-6">
      <div className="w-full max-w-sm rounded-card border border-hairline bg-white p-8 shadow-ambient">
        <div className="mb-8 flex flex-col items-center gap-4 text-center">
          <ValioWordmark size="lg" />
          <div>
            <h1 className="font-display text-xl font-semibold tracking-tight text-ink">
              Accede a tu cuenta
            </h1>
            <p className="mt-1 text-sm text-muted">
              Te enviamos un enlace de acceso a tu correo.
            </p>
          </div>
        </div>

        <form action={action} className="flex flex-col gap-4">
          <div>
            <label htmlFor="email" className="label-caps mb-2 block text-muted">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="tu@email.com"
              className="w-full rounded-card border border-hairline bg-white px-4 py-3 text-base text-ink placeholder:text-muted/50"
            />
          </div>
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-card bg-petrol px-4 py-3 font-display text-base font-semibold text-white transition-colors duration-200 hover:bg-petrol-deep disabled:opacity-50"
          >
            {pending ? 'Enviando…' : 'Enviar enlace de acceso'}
          </button>
        </form>

        {state && (
          <div
            role="status"
            className={`mt-4 flex items-start gap-2.5 rounded-card border p-3 text-sm ${
              isSuccess
                ? 'border-success/25 bg-success/5 text-success'
                : 'border-error/25 bg-error/5 text-error'
            }`}
          >
            {isSuccess ? (
              <MailCheck size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
            ) : (
              <AlertCircle size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
            )}
            <p>{state.message}</p>
          </div>
        )}
      </div>
      <p className="label-caps text-muted/70">VALIO Proptech</p>
    </main>
  )
}
