/**
 * Variables de entorno tipadas.
 *
 * `getSiteUrl()` devuelve la URL pública de la app, usada para construir los
 * enlaces de auth que viajan por email (magic link, confirmación de registro,
 * recuperación de contraseña).
 *
 * Orden de resolución:
 *  1. `NEXT_PUBLIC_SITE_URL` — la fuente explícita y preferida (dominio propio).
 *  2. `VERCEL_PROJECT_PRODUCTION_URL` — dominio estable de producción en Vercel.
 *  3. `VERCEL_URL` — dominio del despliegue concreto (preview/producción).
 *  4. `http://localhost:3000` — desarrollo.
 *
 * Así la app NUNCA revienta en producción por no tener configurada la variable:
 * en Vercel se deduce sola de las env vars del sistema. Conviene fijar
 * `NEXT_PUBLIC_SITE_URL` a un dominio propio antes de usar dominio final, pero
 * su ausencia ya no rompe el registro/acceso.
 *
 * Es una función (no una constante) a propósito: la resolución ocurre en runtime
 * dentro de cada server action, nunca al importar el módulo.
 */
export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (explicit) return explicit.replace(/\/+$/, '')

  const vercelProd = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim()
  if (vercelProd) return `https://${vercelProd.replace(/\/+$/, '')}`

  const vercelUrl = process.env.VERCEL_URL?.trim()
  if (vercelUrl) return `https://${vercelUrl.replace(/\/+$/, '')}`

  return 'http://localhost:3000'
}
