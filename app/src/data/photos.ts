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

export type PhotoValidation =
  | { ok: true; ext: string }
  | { ok: false; reason: string }

/**
 * Valida tipo y tamaño de una foto antes de subirla. Función pura (sin I/O):
 * espeja los límites del bucket (jpeg/png/webp, ≤6 MB) como defensa en el cliente
 * y en el server action; la RLS de Storage y el bucket son la última línea.
 */
export function validatePhoto(file: PhotoLike): PhotoValidation {
  if (!(ALLOWED_PHOTO_MIME as readonly string[]).includes(file.type)) {
    return { ok: false, reason: 'Formato no admitido. Usa JPG, PNG o WEBP.' }
  }
  if (file.size <= 0) {
    return { ok: false, reason: 'El archivo está vacío.' }
  }
  if (file.size > MAX_PHOTO_BYTES) {
    return { ok: false, reason: 'La imagen supera el límite de 6 MB.' }
  }
  return { ok: true, ext: EXT_BY_MIME[file.type as AllowedPhotoMime] }
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
    .order('sort_order', { ascending: true })
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
