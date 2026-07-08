import { describe, expect, it } from 'vitest'
import { mapAuthError } from './auth-errors'

describe('mapAuthError', () => {
  it('mapea credenciales inválidas', () => {
    expect(mapAuthError({ code: 'invalid_credentials' })).toBe('invalidCredentials')
    expect(mapAuthError({ code: 'invalid_grant' })).toBe('invalidCredentials')
  })

  it('mapea rate limit por código y por status 429', () => {
    expect(mapAuthError({ code: 'over_email_send_rate_limit' })).toBe('emailRateLimit')
    expect(mapAuthError({ code: 'over_request_rate_limit' })).toBe('emailRateLimit')
    expect(mapAuthError({ status: 429 })).toBe('emailRateLimit')
  })

  it('mapea usuario existente y contraseña débil', () => {
    expect(mapAuthError({ code: 'user_already_exists' })).toBe('userExists')
    expect(mapAuthError({ code: 'email_exists' })).toBe('userExists')
    expect(mapAuthError({ code: 'weak_password' })).toBe('weakPassword')
  })

  it('cae a genérico ante código desconocido, nulo o ausente', () => {
    expect(mapAuthError({ code: 'algo_raro' })).toBe('generic')
    expect(mapAuthError({ code: null })).toBe('generic')
    expect(mapAuthError(null)).toBe('generic')
    expect(mapAuthError(undefined)).toBe('generic')
  })
})
