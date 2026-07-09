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

  it('cae a localhost cuando no hay ninguna variable', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', '')
    vi.stubEnv('VERCEL_PROJECT_PRODUCTION_URL', '')
    vi.stubEnv('VERCEL_URL', '')
    expect(getSiteUrl()).toBe('http://localhost:3000')
  })

  it('usa el dominio de producción de Vercel si falta la explícita', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', '')
    vi.stubEnv('VERCEL_PROJECT_PRODUCTION_URL', 'valio-mu.vercel.app')
    expect(getSiteUrl()).toBe('https://valio-mu.vercel.app')
  })

  it('cae al dominio del despliegue (VERCEL_URL) si no hay dominio de producción', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', '')
    vi.stubEnv('VERCEL_PROJECT_PRODUCTION_URL', '')
    vi.stubEnv('VERCEL_URL', 'valio-abc123.vercel.app')
    expect(getSiteUrl()).toBe('https://valio-abc123.vercel.app')
  })

  it('prioriza la variable explícita sobre las de Vercel', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://valio.app')
    vi.stubEnv('VERCEL_PROJECT_PRODUCTION_URL', 'valio-mu.vercel.app')
    expect(getSiteUrl()).toBe('https://valio.app')
  })
})
