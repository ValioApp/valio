import { describe, expect, it } from 'vitest'
import { safeNextPath } from './safe-redirect'

describe('safeNextPath', () => {
  it('acepta rutas internas absolutas', () => {
    expect(safeNextPath('/auth/reset', '/valorar')).toBe('/auth/reset')
    expect(safeNextPath('/dashboard?tab=1', '/valorar')).toBe('/dashboard?tab=1')
  })

  it('rechaza ausencia de valor con el fallback', () => {
    expect(safeNextPath(null, '/valorar')).toBe('/valorar')
    expect(safeNextPath(undefined, '/valorar')).toBe('/valorar')
    expect(safeNextPath('', '/valorar')).toBe('/valorar')
  })

  it('rechaza URLs externas', () => {
    expect(safeNextPath('https://evil.com', '/valorar')).toBe('/valorar')
    expect(safeNextPath('evil.com', '/valorar')).toBe('/valorar')
  })

  it('rechaza rutas protocolo-relativas (open redirect)', () => {
    expect(safeNextPath('//evil.com', '/valorar')).toBe('/valorar')
    expect(safeNextPath('/\\evil.com', '/valorar')).toBe('/valorar')
  })
})
