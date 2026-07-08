'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { emailSchema, signInSchema } from '@/lib/auth-schemas'
import { mapAuthError } from '@/lib/auth-errors'
import { getSiteUrl } from '@/lib/env'
import type { AuthState } from '@/lib/auth-state'

/** Acceso principal: email + contraseña → /dashboard. */
export async function signInWithPassword(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = signInSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })
  if (!parsed.success) {
    return { status: 'error', code: 'validation', message: parsed.error.issues[0].message }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(parsed.data)
  if (error) {
    // Acceso: NO distinguimos el motivo (credenciales, usuario inexistente,
    // etc.) para no facilitar enumeración de cuentas. Mensaje único.
    return { status: 'error', code: 'invalidCredentials' }
  }

  redirect('/dashboard')
}

/** Acceso alternativo (discreto): enlace mágico por email. */
export async function sendMagicLink(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = emailSchema.safeParse({ email: formData.get('email') })
  if (!parsed.success) {
    return { status: 'error', code: 'validation', message: parsed.error.issues[0].message }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    // El login NUNCA crea cuentas: un email desconocido no debe provocar alta
    // (evita registro por spam y el consiguiente workspace fantasma). El alta
    // pasa siempre por /signup.
    options: { emailRedirectTo: `${getSiteUrl()}/auth/confirm`, shouldCreateUser: false },
  })
  if (error) {
    return { status: 'error', code: mapAuthError(error) }
  }
  return { status: 'sent' }
}
