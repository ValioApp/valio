'use client'

import { useActionState } from 'react'
import { sendMagicLink } from './actions'

export default function LoginPage() {
  const [state, action, pending] = useActionState(sendMagicLink, null)
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 p-6">
      <h1 className="text-2xl font-semibold">VALIO — acceso</h1>
      <form action={action} className="flex flex-col gap-3">
        <input
          name="email"
          type="email"
          required
          placeholder="tu@email.com"
          className="rounded-md border px-3 py-2"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-black px-3 py-2 text-white disabled:opacity-50"
        >
          {pending ? 'Enviando…' : 'Enviar enlace de acceso'}
        </button>
      </form>
      {state && <p className="text-sm text-gray-600">{state.message}</p>}
    </main>
  )
}
