import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ValorarForm } from './ValorarForm'

/**
 * Guard de sesión: /valorar requiere estar autenticado (como dashboard y
 * cartera). El layout del grupo (app) NO se gatea a propósito, porque /demo es
 * pública. El formulario en sí es un client component (ValorarForm).
 */
export default async function ValorarPage() {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) redirect('/login')

  return <ValorarForm />
}
