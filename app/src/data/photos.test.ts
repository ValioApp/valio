import { describe, expect, it } from 'vitest'
import { MAX_PHOTO_BYTES, validatePhoto } from './photos'

describe('validatePhoto', () => {
  it('acepta jpeg/png/webp válidos y devuelve la extensión correcta', () => {
    expect(validatePhoto({ type: 'image/jpeg', size: 1024 })).toEqual({ ok: true, ext: 'jpg' })
    expect(validatePhoto({ type: 'image/png', size: 1024 })).toEqual({ ok: true, ext: 'png' })
    expect(validatePhoto({ type: 'image/webp', size: 1024 })).toEqual({ ok: true, ext: 'webp' })
  })

  it('rechaza tipos no admitidos (gif, pdf, vacío)', () => {
    expect(validatePhoto({ type: 'image/gif', size: 1024 }).ok).toBe(false)
    expect(validatePhoto({ type: 'application/pdf', size: 1024 }).ok).toBe(false)
    expect(validatePhoto({ type: '', size: 1024 }).ok).toBe(false)
  })

  it('rechaza archivos vacíos y los que superan 6 MB', () => {
    expect(validatePhoto({ type: 'image/jpeg', size: 0 }).ok).toBe(false)
    expect(validatePhoto({ type: 'image/jpeg', size: MAX_PHOTO_BYTES + 1 }).ok).toBe(false)
    // el límite exacto sí se admite
    expect(validatePhoto({ type: 'image/jpeg', size: MAX_PHOTO_BYTES })).toEqual({ ok: true, ext: 'jpg' })
  })
})
