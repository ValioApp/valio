import { z } from 'zod'

/**
 * Esquemas Zod compartidos por las server actions de auth (signup, login,
 * recuperación y reset). Puros y testeables; los mensajes son claves cortas
 * en español (la UI de auth es server-rendered y ya localizada por next-intl,
 * pero los errores de validación de contraseña/email se muestran en español).
 */

/** Contraseña mínima de 8 caracteres (regla de producto de VALIO). */
export const passwordSchema = z
  .string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres')

/** Registro: email + contraseña + nombre de espacio opcional. */
export const signUpSchema = z.object({
  email: z.email('Introduce un email válido'),
  password: passwordSchema,
  // Vacío en el formulario ('') se normaliza a undefined para no mandar
  // workspace_name en blanco a Supabase (handle_new_user usa un fallback).
  workspaceName: z
    .string()
    .trim()
    .max(80, 'El nombre del espacio es demasiado largo')
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
})

/** Acceso con contraseña: email + contraseña no vacía. */
export const signInSchema = z.object({
  email: z.email('Introduce un email válido'),
  password: z.string().min(1, 'Introduce tu contraseña'),
})

/** Solo email (magic link, recuperación de contraseña). */
export const emailSchema = z.object({
  email: z.email('Introduce un email válido'),
})

/** Nueva contraseña en el flujo de reset. */
export const resetPasswordSchema = z.object({
  password: passwordSchema,
})

export type SignUpInput = z.infer<typeof signUpSchema>
export type SignInInput = z.infer<typeof signInSchema>
export type EmailInput = z.infer<typeof emailSchema>
