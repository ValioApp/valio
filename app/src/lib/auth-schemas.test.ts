import { describe, expect, it } from 'vitest'
import { emailSchema, signInSchema, signUpSchema } from './auth-schemas'

describe('signUpSchema', () => {
  it('acepta un registro válido con nombre de espacio', () => {
    const parsed = signUpSchema.parse({
      email: 'ana@example.com',
      password: 'supersecreta',
      workspaceName: '  Inmobiliaria Sol  ',
    })
    expect(parsed.email).toBe('ana@example.com')
    expect(parsed.workspaceName).toBe('Inmobiliaria Sol')
  })

  it('normaliza el nombre de espacio vacío a undefined', () => {
    expect(signUpSchema.parse({ email: 'a@b.com', password: '12345678', workspaceName: '' }).workspaceName).toBeUndefined()
    expect(signUpSchema.parse({ email: 'a@b.com', password: '12345678' }).workspaceName).toBeUndefined()
  })

  it('rechaza contraseñas de menos de 8 caracteres', () => {
    const res = signUpSchema.safeParse({ email: 'a@b.com', password: 'corta' })
    expect(res.success).toBe(false)
  })

  it('rechaza emails inválidos', () => {
    const res = signUpSchema.safeParse({ email: 'no-es-email', password: '12345678' })
    expect(res.success).toBe(false)
  })
})

describe('signInSchema', () => {
  it('exige una contraseña no vacía', () => {
    expect(signInSchema.safeParse({ email: 'a@b.com', password: '' }).success).toBe(false)
    expect(signInSchema.safeParse({ email: 'a@b.com', password: 'x' }).success).toBe(true)
  })
})

describe('emailSchema', () => {
  it('valida el email de recuperación', () => {
    expect(emailSchema.safeParse({ email: 'a@b.com' }).success).toBe(true)
    expect(emailSchema.safeParse({ email: 'nope' }).success).toBe(false)
  })
})
