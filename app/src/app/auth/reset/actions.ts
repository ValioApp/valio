'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { resetPasswordSchema } from '@/lib/auth-schemas'
import type { AuthState } from '@/lib/auth-state'

/**
 * Fija la nueva contraseña. La sesión de recuperación ya está establecida por
 * /auth/confirm (llegó por el enlace del email), así que updateUser opera sobre
 * ella. Éxito → /dashboard.
 */
export async function updatePassword(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = resetPasswordSchema.safeParse({ password: formData.get('password') })
  if (!parsed.success) {
    return { status: 'error', code: 'validation', message: parsed.error.issues[0].message }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password })
  if (error) {
    return { status: 'error', code: 'generic', message: error.message }
  }

  redirect('/dashboard')
}
