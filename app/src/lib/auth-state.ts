/** Estado compartido que devuelven las server actions de auth a la UI. */
export type AuthErrorCode = 'validation' | 'invalid' | 'generic'

export type AuthResult =
  | { status: 'error'; code: AuthErrorCode; message?: string }
  | { status: 'sent' }

/** `null` es el estado inicial de `useActionState`. */
export type AuthState = AuthResult | null
