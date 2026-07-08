import { describe, expect, it } from 'vitest'
import { MAX_PHOTO_BYTES, sniffPhotoMime, validatePhoto, validatePhotoBytes } from './photos'

/** Cabeceras mínimas con la firma real de cada formato + relleno hasta 12 bytes. */
const JPEG_HEADER = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0])
const PNG_HEADER = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0])
const WEBP_HEADER = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50])

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

describe('sniffPhotoMime', () => {
  it('detecta jpeg/png/webp por su firma de bytes', () => {
    expect(sniffPhotoMime(JPEG_HEADER)).toBe('image/jpeg')
    expect(sniffPhotoMime(PNG_HEADER)).toBe('image/png')
    expect(sniffPhotoMime(WEBP_HEADER)).toBe('image/webp')
  })

  it('devuelve null si la cabecera no casa con la allowlist', () => {
    // %PDF-1.4 (25 50 44 46...) no es una imagen admitida
    expect(sniffPhotoMime(new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]))).toBeNull()
    // RIFF sin marca WEBP en offset 8 (p.ej. WAV) → no es webp
    expect(sniffPhotoMime(new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x41, 0x56, 0x45]))).toBeNull()
    // cabecera demasiado corta no revienta
    expect(sniffPhotoMime(new Uint8Array([0xff, 0xd8]))).toBeNull()
  })
})

describe('validatePhotoBytes (anti content-type spoofing, CWE-434)', () => {
  it('acepta cada formato cuando la firma coincide con el tipo declarado', () => {
    expect(validatePhotoBytes({ header: JPEG_HEADER, size: 1024, declaredType: 'image/jpeg' })).toEqual({ ok: true, ext: 'jpg' })
    expect(validatePhotoBytes({ header: PNG_HEADER, size: 1024, declaredType: 'image/png' })).toEqual({ ok: true, ext: 'png' })
    expect(validatePhotoBytes({ header: WEBP_HEADER, size: 1024, declaredType: 'image/webp' })).toEqual({ ok: true, ext: 'webp' })
  })

  it('rechaza un binario con Content-Type image/png pero magic bytes de JPEG', () => {
    const res = validatePhotoBytes({ header: JPEG_HEADER, size: 1024, declaredType: 'image/png' })
    expect(res.ok).toBe(false)
  })

  it('rechaza contenido que no es ninguna imagen de la allowlist (spoofing puro)', () => {
    // ejecutable ELF (7F 45 4C 46) camuflado como image/png
    const elf = new Uint8Array([0x7f, 0x45, 0x4c, 0x46, 0, 0, 0, 0, 0, 0, 0, 0])
    expect(validatePhotoBytes({ header: elf, size: 1024, declaredType: 'image/png' }).ok).toBe(false)
  })

  it('sigue aplicando los límites de tipo/tamaño antes de mirar los bytes', () => {
    expect(validatePhotoBytes({ header: JPEG_HEADER, size: 0, declaredType: 'image/jpeg' }).ok).toBe(false)
    expect(validatePhotoBytes({ header: JPEG_HEADER, size: MAX_PHOTO_BYTES + 1, declaredType: 'image/jpeg' }).ok).toBe(false)
    expect(validatePhotoBytes({ header: JPEG_HEADER, size: 1024, declaredType: 'image/gif' }).ok).toBe(false)
  })
})
