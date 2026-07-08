import type { SupabaseClient } from '@supabase/supabase-js'

/** Bucket privado de fotos del inmueble (creado en Storage, RLS en migración 0005). */
export const PHOTOS_BUCKET = 'property-photos'
/** URLs firmadas válidas 1 h: suficiente para renderizar el carrusel sin exponer el objeto. */
const SIGNED_URL_TTL = 3600

export const MAX_PHOTO_BYTES = 6 * 1024 * 1024
export const MAX_PHOTOS_PER_PROPERTY = 12
export const ALLOWED_PHOTO_MIME = ['image/jpeg', 'image/png', 'image/webp'] as const
export type AllowedPhotoMime = (typeof ALLOWED_PHOTO_MIME)[number]

const EXT_BY_MIME: Record<AllowedPhotoMime, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

/** Metadatos mínimos de un archivo para validarlo (estructural: testeable sin `File`). */
export interface PhotoLike {
  type: string
  size: number
}

/**
 * Código de error de validación (clave i18n, no texto): el mensaje visible lo
 * resuelve el consumidor (cliente o server action) contra el catálogo `photos.errors`.
 */
export type PhotoErrorCode =
  | 'formatNotAllowed'
  | 'empty'
  | 'tooLarge'
  | 'notValidImage'
  | 'contentMismatch'

export type PhotoValidation =
  | { ok: true; ext: string }
  | { ok: false; reason: PhotoErrorCode }

/**
 * Valida tipo y tamaño de una foto antes de subirla. Función pura (sin I/O):
 * espeja los límites del bucket (jpeg/png/webp, ≤6 MB) como defensa en el cliente
 * y en el server action; la RLS de Storage y el bucket son la última línea.
 * NO mira el contenido: el cliente solo tiene los metadatos del `File`. La
 * verificación de bytes mágicos vive en el server (`validatePhotoBytes`).
 */
export function validatePhoto(file: PhotoLike): PhotoValidation {
  if (!(ALLOWED_PHOTO_MIME as readonly string[]).includes(file.type)) {
    return { ok: false, reason: 'formatNotAllowed' }
  }
  if (file.size <= 0) {
    return { ok: false, reason: 'empty' }
  }
  if (file.size > MAX_PHOTO_BYTES) {
    return { ok: false, reason: 'tooLarge' }
  }
  return { ok: true, ext: EXT_BY_MIME[file.type as AllowedPhotoMime] }
}

/** ¿`bytes` empieza por la firma `sig` a partir de `offset`? (comparación pura). */
function startsWith(bytes: Uint8Array, sig: readonly number[], offset = 0): boolean {
  if (bytes.length < offset + sig.length) return false
  for (let i = 0; i < sig.length; i += 1) {
    if (bytes[offset + i] !== sig[i]) return false
  }
  return true
}

/**
 * Firmas de bytes mágicos por MIME de la allowlist:
 *  - JPEG:  FF D8 FF
 *  - PNG:   89 50 4E 47 0D 0A 1A 0A
 *  - WEBP:  RIFF (52 49 46 46) en offset 0 + WEBP (57 45 42 50) en offset 8
 */
const MAGIC_MATCHERS: Record<AllowedPhotoMime, (h: Uint8Array) => boolean> = {
  'image/jpeg': (h) => startsWith(h, [0xff, 0xd8, 0xff]),
  'image/png': (h) => startsWith(h, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  'image/webp': (h) => startsWith(h, [0x52, 0x49, 0x46, 0x46]) && startsWith(h, [0x57, 0x45, 0x42, 0x50], 8),
}

/** Nº de bytes de cabecera suficientes para decidir (WEBP necesita hasta el byte 11). */
export const PHOTO_HEADER_BYTES = 12

/**
 * Detecta el MIME real de una imagen por su firma de bytes; `null` si no casa con
 * ningún tipo de la allowlist. Función pura y testeable (recibe la cabecera cruda).
 */
export function sniffPhotoMime(header: Uint8Array): AllowedPhotoMime | null {
  for (const mime of ALLOWED_PHOTO_MIME) {
    if (MAGIC_MATCHERS[mime](header)) return mime
  }
  return null
}

/**
 * Validación completa server-side (anti content-type spoofing, CWE-434): tipo + tamaño
 * (via `validatePhoto`) Y coherencia entre el Content-Type declarado y los bytes mágicos
 * reales. Rechaza un binario que se declara `image/png` pero cuya cabecera es otra cosa.
 * Pura: recibe la cabecera cruda, el tamaño y el tipo declarado.
 */
export function validatePhotoBytes(input: {
  header: Uint8Array
  size: number
  declaredType: string
}): PhotoValidation {
  const meta = validatePhoto({ type: input.declaredType, size: input.size })
  if (!meta.ok) return meta

  const actual = sniffPhotoMime(input.header)
  if (actual === null) {
    return { ok: false, reason: 'notValidImage' }
  }
  if (actual !== input.declaredType) {
    return { ok: false, reason: 'contentMismatch' }
  }
  return { ok: true, ext: EXT_BY_MIME[actual] }
}

/** Foto lista para pintar en el carrusel (URL firmada temporal). */
export interface PropertyPhoto {
  id: string
  path: string
  signedUrl: string
}

interface PhotoRow {
  id: string
  storage_path: string
  sort_order: number
}

/**
 * Fotos de una property ordenadas por sort_order, con URL firmada por cada objeto.
 * La RLS de property_photos filtra por workspace; la de storage.objects autoriza la
 * firma. Un objeto que no se pueda firmar se omite en vez de romper toda la lista.
 */
export async function listPropertyPhotos(
  supabase: SupabaseClient,
  propertyId: string,
): Promise<PropertyPhoto[]> {
  const { data, error } = await supabase
    .from('property_photos')
    .select('id, storage_path, sort_order')
    .eq('property_id', propertyId)
    // Desempate estable por created_at: si dos fotos comparten sort_order (colisión
    // heredada), el orden de la lista no depende del capricho del planner.
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })
  if (error) throw new Error(`property_photos: ${error.message}`)

  const rows = (data ?? []) as PhotoRow[]
  if (rows.length === 0) return []

  const { data: signed, error: signError } = await supabase.storage
    .from(PHOTOS_BUCKET)
    .createSignedUrls(
      rows.map((r) => r.storage_path),
      SIGNED_URL_TTL,
    )
  if (signError) throw new Error(`createSignedUrls: ${signError.message}`)

  const urlByPath = new Map(
    (signed ?? [])
      .filter((s): s is { path: string; signedUrl: string; error: null } => !!s.signedUrl && !!s.path)
      .map((s) => [s.path, s.signedUrl]),
  )

  const out: PropertyPhoto[] = []
  for (const row of rows) {
    const signedUrl = urlByPath.get(row.storage_path)
    if (!signedUrl) continue
    out.push({ id: row.id, path: row.storage_path, signedUrl })
  }
  return out
}
