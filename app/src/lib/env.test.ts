import { afterEach, describe, expect, it, vi } from 'vitest'
import { getSiteUrl } from './env'

describe('getSiteUrl', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('devuelve la URL configurada sin barra final', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://valio.app/')
    expect(getSiteUrl()).toBe('https://valio.app')
  })

  it('recorta espacios y barras finales redundantes', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', '  https://valio.app///  ')
    expect(getSiteUrl()).toBe('https://valio.app')
  })

  it('cae a localhost en desarrollo cuando falta la variable', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', '')
    vi.stubEnv('NODE_ENV', 'development')
    expect(getSiteUrl()).toBe('http://localhost:3000')
  })

  it('lanza en producción cuando falta la variable', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', '')
    vi.stubEnv('NODE_ENV', 'production')
    expect(() => getSiteUrl()).toThrow(/NEXT_PUBLIC_SITE_URL/)
  })
})
