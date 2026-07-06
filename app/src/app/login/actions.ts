'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const schema = z.object({ email: z.email('Email no válido') })

export async function sendMagicLink(
  _prev: { message: string } | null,
  formData: FormData,
): Promise<{ message: string }> {
  const parsed = schema.safeParse({ email: formData.get('email') })
  if (!parsed.success) return { message: parsed.error.issues[0].message }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: { emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/auth/confirm` },
  })
  if (error) return { message: `Error: ${error.message}` }
  return { message: 'Revisa tu correo: te hemos enviado un enlace de acceso.' }
}
