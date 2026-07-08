import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Proxy (antes "middleware" — renombrado en Next 16, ver
 * node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md).
 *
 * Refresca la sesión de Supabase en cada request (patrón oficial updateSession
 * de @supabase/ssr): reescribe las cookies de auth para que los Server
 * Components (dashboard, cartera, valorar) no pierdan la sesión. No hace gating
 * de rutas — cada Server Component/acción sigue verificando `getUser` por su
 * cuenta.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  // IMPORTANTE: no ejecutar código entre createServerClient y getUser.
  await supabase.auth.getUser()

  return response
}

export const config = {
  matcher: [
    /*
     * Todas las rutas salvo estáticos, imagen optimizada y assets con extensión.
     * Así el refresco de sesión cubre páginas y server actions sin tocar los
     * ficheros de /public ni _next.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml)$).*)',
  ],
}
