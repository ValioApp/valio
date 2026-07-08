'use server'

import { createClient } from '@/lib/supabase/server'
import { emailSchema } from '@/lib/auth-schemas'
import { mapAuthError } from '@/lib/auth-errors'
import { getSiteUrl } from '@/lib/env'
import type { AuthState } from '@/lib/auth-state'

/**
 * Recuperación de contraseña. El enlace del email pasa por /auth/confirm (que
 * intercambia el `code` y fija la sesión de recuperación en una cookie — un
 * Route Handler sí puede escribir cookies) y de ahí a /auth/reset con `next`.
 *
 * Respuesta SIEMPRE neutra: no se revela si el email existe. El único error que
 * se comunica es el rate limit (accionable por el usuario); cualquier otro
 * fallo se presenta como "enviado" para no filtrar información de enumeración
 * ni de infraestructura. Nunca se devuelve el `error.message` crudo.
 */
export async function requestPasswordReset(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = emailSchema.safeParse({ email: formData.get('email') })
  if (!parsed.success) {
    return { status: 'error', code: 'validation', message: parsed.error.issues[0].message }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${getSiteUrl()}/auth/confirm?next=/auth/reset`,
  })
  if (error) {
    const code = mapAuthError(error)
    if (code === 'emailRateLimit') return { status: 'error', code }
  }
  return { status: 'sent' }
}
