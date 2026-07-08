import type { MappedAuthErrorCode } from './auth-errors'

/**
 * Estado compartido que devuelven las server actions de auth a la UI.
 *
 * `code` es una clave estable, no un mensaje: la UI lo traduce con next-intl.
 * - `validation`: error de Zod → se muestra `message` (ya localizado en es).
 * - resto: claves bajo `auth.errors.*` (ver `auth-errors.ts`), nunca el
 *   `error.message` crudo de Supabase.
 */
export type AuthErrorCode = 'validation' | MappedAuthErrorCode

export type AuthResult =
  | { status: 'error'; code: AuthErrorCode; message?: string }
  | { status: 'sent' }

/** `null` es el estado inicial de `useActionState`. */
export type AuthState = AuthResult | null
