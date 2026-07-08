/**
 * Valida el parámetro `next` de un callback de auth para evitar open redirects.
 *
 * Solo se acepta una ruta interna absoluta (empieza por '/'). Se rechazan
 * explícitamente las rutas protocolo-relativas, que el navegador resuelve
 * contra OTRO host y son el vector clásico de open redirect:
 *   - `//evil.com`  → el navegador la trata como `https://evil.com`
 *   - `/\evil.com`  → equivalente con backslash (WHATWG normaliza `\` a `/`)
 *
 * Ante cualquier valor no válido (ausente, externo o protocolo-relativo) se
 * devuelve el `fallback` seguro.
 */
export function safeNextPath(next: string | null | undefined, fallback: string): string {
  if (!next) return fallback
  if (!next.startsWith('/')) return fallback
  if (next.startsWith('//')) return fallback
  if (next.startsWith('/\\')) return fallback
  return next
}
