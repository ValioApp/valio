'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { signUpSchema } from '@/lib/auth-schemas'
import type { AuthState } from '@/lib/auth-state'

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

/**
 * Registro con email + contraseña. `workspace_name` viaja en `options.data`
 * (raw_user_meta_data) → el trigger `handle_new_user` (migración 0001) crea el
 * workspace y la membership al confirmarse el usuario.
 *
 * Con `mailer_autoconfirm` activo (provisional), signUp devuelve sesión directa
 * → /dashboard. Si algún día se exige confirmación por email, no hay sesión y se
 * muestra el estado "revisa tu correo".
 */
export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = signUpSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    workspaceName: formData.get('workspaceName') ?? undefined,
  })
  if (!parsed.success) {
    return { status: 'error', code: 'validation', message: parsed.error.issues[0].message }
  }

  const { email, password, workspaceName } = parsed.data
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: workspaceName ? { workspace_name: workspaceName } : undefined,
      emailRedirectTo: `${SITE}/auth/confirm`,
    },
  })

  if (error) {
    return { status: 'error', code: 'generic', message: error.message }
  }

  if (data.session) {
    redirect('/dashboard')
  }

  return { status: 'sent' }
}
