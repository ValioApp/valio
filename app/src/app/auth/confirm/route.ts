import { type EmailOtpType } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Callback de acceso. Soporta los dos flujos de Supabase:
 * - `?code=` (PKCE, plantilla por defecto {{ .ConfirmationURL }} — tier gratuito)
 * - `?token_hash=&type=` (plantilla personalizada con SMTP propio, futuro)
 *
 * Al ser un Route Handler SÍ puede escribir la cookie de sesión, por eso el
 * flujo de recuperación de contraseña pasa por aquí (`?next=/auth/reset`) antes
 * de mostrar el formulario de nueva contraseña. `next` se valida como ruta
 * relativa para no permitir open redirects.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const nextParam = searchParams.get('next')
  const dest = nextParam && nextParam.startsWith('/') ? nextParam : '/valorar'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) redirect(dest)
  }

  if (tokenHash && type) {
    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
    if (!error) redirect(dest)
  }

  redirect('/login')
}
