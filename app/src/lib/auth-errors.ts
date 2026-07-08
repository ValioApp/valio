/**
 * Mapeo de errores de Supabase Auth a claves i18n seguras.
 *
 * NUNCA se devuelve `error.message` crudo del proveedor a la UI: puede revelar
 * detalles internos, facilitar enumeración de usuarios o filtrar información de
 * infraestructura. En su lugar se mapea por `error.code` (estable) a una clave
 * corta bajo el namespace `auth.errors`, con caída a `generic` ante cualquier
 * código no previsto.
 */

/** Códigos de error de auth que tienen su propia clave en `auth.errors`. */
export type MappedAuthErrorCode =
  | 'invalidCredentials'
  | 'emailRateLimit'
  | 'userExists'
  | 'weakPassword'
  | 'generic'

/** Forma mínima del error de Supabase que necesitamos para clasificar. */
interface SupabaseErrorLike {
  code?: string | null
  status?: number
}

export function mapAuthError(error: SupabaseErrorLike | null | undefined): MappedAuthErrorCode {
  switch (error?.code) {
    case 'invalid_credentials':
    case 'invalid_grant':
      return 'invalidCredentials'
    case 'over_email_send_rate_limit':
    case 'over_request_rate_limit':
    case 'over_sms_send_rate_limit':
      return 'emailRateLimit'
    case 'user_already_exists':
    case 'email_exists':
      return 'userExists'
    case 'weak_password':
      return 'weakPassword'
    default:
      // Sin código específico: el 429 (HTTP) es siempre rate limit.
      if (error?.status === 429) return 'emailRateLimit'
      return 'generic'
  }
}
