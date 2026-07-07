'use server'

import { createClient } from '@/lib/supabase/server'
import {
  listPropertyPhotos,
  validatePhoto,
  MAX_PHOTOS_PER_PROPERTY,
  PHOTOS_BUCKET,
  type PropertyPhoto,
} from '@/data/photos'

export type PhotoActionResult =
  | { status: 'ok'; photos: PropertyPhoto[] }
  | { status: 'error'; message: string }

/** Workspace del usuario autenticado (una membresía por usuario en MVP). */
async function resolveWorkspaceId(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<string | null> {
  const { data, error } = await supabase.from('members').select('workspace_id').limit(1).single()
  if (error || !data) return null
  return data.workspace_id as string
}

/** Lista las fotos de una property (para hidratar el carrusel al montar). */
export async function listPhotosAction(propertyId: string): Promise<PhotoActionResult> {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return { status: 'error', message: 'Inicia sesión para ver las fotos.' }
  try {
    const photos = await listPropertyPhotos(supabase, propertyId)
    return { status: 'ok', photos }
  } catch (e) {
    return { status: 'error', message: e instanceof Error ? e.message : 'Error inesperado' }
  }
}

/**
 * Sube una o varias fotos (campo `photos` del FormData) a la property.
 * Auth + workspace + comprobación de pertenencia de la property (defensa en
 * profundidad, además de la RLS). Valida cada archivo, respeta el máximo total,
 * sube a <workspace_id>/<propertyId>/<uuid>.<ext> e inserta la fila. Devuelve la
 * lista actualizada. Si falla el insert, revierte el objeto para no dejar huérfanos.
 */
export async function uploadPropertyPhotos(
  propertyId: string,
  formData: FormData,
): Promise<PhotoActionResult> {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return { status: 'error', message: 'Inicia sesión para subir fotos.' }

  const workspaceId = await resolveWorkspaceId(supabase)
  if (!workspaceId) return { status: 'error', message: 'No se encontró tu workspace.' }

  // La property debe pertenecer al workspace (la RLS ya lo garantiza; esto es explícito).
  const { data: property, error: propertyError } = await supabase
    .from('properties')
    .select('id')
    .eq('id', propertyId)
    .single()
  if (propertyError || !property) {
    return { status: 'error', message: 'Inmueble no encontrado o sin acceso.' }
  }

  const files = formData
    .getAll('photos')
    .filter((f): f is File => f instanceof File && f.size > 0)
  if (files.length === 0) return { status: 'error', message: 'No se han seleccionado fotos.' }

  const existing = await listPropertyPhotos(supabase, propertyId)
  if (existing.length + files.length > MAX_PHOTOS_PER_PROPERTY) {
    return {
      status: 'error',
      message: `Máximo ${MAX_PHOTOS_PER_PROPERTY} fotos por inmueble (ya hay ${existing.length}).`,
    }
  }

  let sortOrder = existing.length
  for (const file of files) {
    const check = validatePhoto(file)
    if (!check.ok) return { status: 'error', message: check.reason }

    const path = `${workspaceId}/${propertyId}/${crypto.randomUUID()}.${check.ext}`
    const bytes = new Uint8Array(await file.arrayBuffer())
    const { error: uploadError } = await supabase.storage
      .from(PHOTOS_BUCKET)
      .upload(path, bytes, { contentType: file.type, upsert: false })
    if (uploadError) {
      return { status: 'error', message: `No se pudo subir la imagen: ${uploadError.message}` }
    }

    const { error: insertError } = await supabase.from('property_photos').insert({
      property_id: propertyId,
      workspace_id: workspaceId,
      storage_path: path,
      sort_order: sortOrder,
    })
    if (insertError) {
      await supabase.storage.from(PHOTOS_BUCKET).remove([path])
      return { status: 'error', message: `No se pudo registrar la foto: ${insertError.message}` }
    }
    sortOrder += 1
  }

  const photos = await listPropertyPhotos(supabase, propertyId)
  return { status: 'ok', photos }
}

/** Borra una foto: primero la fila (RLS) y después el objeto de Storage. */
export async function deletePropertyPhoto(photoId: string): Promise<PhotoActionResult> {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return { status: 'error', message: 'Inicia sesión para borrar fotos.' }

  const { data: photo, error: fetchError } = await supabase
    .from('property_photos')
    .select('id, property_id, storage_path')
    .eq('id', photoId)
    .single()
  if (fetchError || !photo) return { status: 'error', message: 'Foto no encontrada o sin acceso.' }

  const { error: deleteError } = await supabase.from('property_photos').delete().eq('id', photoId)
  if (deleteError) return { status: 'error', message: `No se pudo borrar: ${deleteError.message}` }

  await supabase.storage.from(PHOTOS_BUCKET).remove([photo.storage_path as string])

  const photos = await listPropertyPhotos(supabase, photo.property_id as string)
  return { status: 'ok', photos }
}
