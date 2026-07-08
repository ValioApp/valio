'use server'

import { createClient } from '@/lib/supabase/server'
import { emailSchema } from '@/lib/auth-schemas'
import type { AuthState } from '@/lib/auth-state'

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

/**
 * Recuperación de contraseña. El enlace del email pasa por /auth/confirm (que
 * intercambia el `code` y fija la sesión de recuperación en una cookie — un
 * Route Handler sí puede escribir cookies) y de ahí a /auth/reset con `next`.
 * No se revela si el email existe: siempre 'sent' salvo error de infraestructura.
 */
export async function requestPasswordReset(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = emailSchema.safeParse({ email: formData.get('email') })
  if (!parsed.success) {
    return { status: 'error', code: 'validation', message: parsed.error.issues[0].message }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${SITE}/auth/confirm?next=/auth/reset`,
  })
  if (error) {
    return { status: 'error', code: 'generic', message: error.message }
  }
  return { status: 'sent' }
}
