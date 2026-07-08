'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { emailSchema, signInSchema } from '@/lib/auth-schemas'
import type { AuthState } from '@/lib/auth-state'

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

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
    // Credenciales inválidas u otro fallo de acceso: mensaje único y legible.
    return { status: 'error', code: 'invalid' }
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
    options: { emailRedirectTo: `${SITE}/auth/confirm` },
  })
  if (error) {
    return { status: 'error', code: 'generic', message: error.message }
  }
  return { status: 'sent' }
}
