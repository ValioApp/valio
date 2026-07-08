/**
 * Variables de entorno tipadas con fail-fast.
 *
 * `getSiteUrl()` devuelve la URL pública de la app, usada para construir los
 * enlaces de auth que viajan por email (magic link, confirmación de registro,
 * recuperación de contraseña). En PRODUCCIÓN es OBLIGATORIA: sin ella, un
 * fallback a localhost enviaría a los usuarios enlaces rotos —o peor,
 * redirigibles a un host equivocado—, así que se lanza un error explícito.
 * En desarrollo cae a http://localhost:3000.
 *
 * Es una función (no una constante) a propósito: la resolución ocurre en
 * runtime dentro de cada server action, nunca al importar el módulo, para que
 * `next build` (que corre con NODE_ENV=production) no falle por la ausencia de
 * la variable en el entorno de build. El fail-fast se dispara en la primera
 * request real de producción que la necesite.
 */
export function getSiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (fromEnv) return fromEnv.replace(/\/+$/, '')

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'NEXT_PUBLIC_SITE_URL es obligatoria en producción: se usa para construir los enlaces de auth que se envían por email.',
    )
  }

  return 'http://localhost:3000'
}
