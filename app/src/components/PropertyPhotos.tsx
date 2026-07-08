'use client'

/* Fotos de un inmueble: dropzone + carrusel casero (sin librerías) con teclado
 * ←/→, miniaturas, borrado con confirmación y grid imprimible de hasta 3 fotos.
 * URLs privadas firmadas → <img> plano (next/image optimizaría/cachearía objetos
 * privados de vida corta, que no es lo que queremos). */
/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { AlertCircle, ChevronLeft, ChevronRight, ImagePlus, Loader2, Trash2 } from 'lucide-react'
import {
  deletePropertyPhoto,
  listPhotosAction,
  uploadPropertyPhotos,
} from '@/app/(app)/valorar/photo-actions'
import { MAX_PHOTOS_PER_PROPERTY, validatePhoto, type PropertyPhoto } from '@/data/photos'

export function PropertyPhotos({ propertyId }: { propertyId: string }) {
  const t = useTranslations('photos')
  const [photos, setPhotos] = useState<PropertyPhoto[]>([])
  const [loaded, setLoaded] = useState(false)
  const [current, setCurrent] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)
  const cancelDeleteRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    let active = true
    void listPhotosAction(propertyId).then((res) => {
      if (!active) return
      if (res.status === 'ok') setPhotos(res.photos)
      else setError(res.message)
      setLoaded(true)
    })
    return () => {
      active = false
    }
  }, [propertyId])

  // Al abrir el diálogo de borrado, el foco va al botón cancelar (destructivo → salida segura).
  useEffect(() => {
    if (confirmDeleteId) cancelDeleteRef.current?.focus()
  }, [confirmDeleteId])

  const safeCurrent = photos.length === 0 ? 0 : Math.min(current, photos.length - 1)
  const canAddMore = photos.length < MAX_PHOTOS_PER_PROPERTY

  function openPicker() {
    inputRef.current?.click()
  }

  function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return
    const files = Array.from(fileList)
    // Validación previa en cliente: evita disparar el límite de body de los Server
    // Actions (error de framework no capturable) y da feedback inmediato.
    for (const file of files) {
      const check = validatePhoto(file)
      if (!check.ok) {
        setError(t(`errors.${check.reason}`))
        if (inputRef.current) inputRef.current.value = ''
        return
      }
    }
    setError(null)
    // Subida por-archivo (un request por foto): cada uno queda muy por debajo del
    // bodySizeLimit aunque el usuario seleccione varias de 6 MB a la vez.
    startTransition(async () => {
      let lastPhotos: PropertyPhoto[] | null = null
      let failure: string | null = null
      for (const file of files) {
        const fd = new FormData()
        fd.append('photos', file)
        const res = await uploadPropertyPhotos(propertyId, fd)
        if (res.status === 'error') {
          failure = res.message
          break
        }
        lastPhotos = res.photos
      }
      if (lastPhotos) {
        setPhotos(lastPhotos)
        setCurrent(Math.max(0, lastPhotos.length - 1)) // muestra la última subida
      }
      if (failure) setError(failure)
    })
    if (inputRef.current) inputRef.current.value = ''
  }

  function confirmDelete(id: string) {
    setError(null)
    startTransition(async () => {
      const res = await deletePropertyPhoto(id)
      setConfirmDeleteId(null)
      if (res.status === 'error') {
        setError(res.message)
        return
      }
      setPhotos(res.photos)
      setCurrent((c) => Math.min(c, Math.max(0, res.photos.length - 1)))
    })
  }

  const goPrev = () => setCurrent((c) => (c - 1 + photos.length) % photos.length)
  const goNext = () => setCurrent((c) => (c + 1) % photos.length)

  function onKeyDown(e: React.KeyboardEvent) {
    if (confirmDeleteId) return // con el diálogo de borrado abierto no se navega
    if (photos.length < 2) return
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      goPrev()
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      goNext()
    }
  }

  const hasPhotos = photos.length > 0

  return (
    <section
      className={`break-inside-avoid rounded-card border border-hairline bg-white p-6 shadow-ambient ${
        loaded && !hasPhotos ? 'print-hidden' : ''
      }`}
      aria-busy={pending}
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ImagePlus size={18} className="text-petrol" aria-hidden="true" />
          <h3 className="font-display text-lg font-semibold text-ink">{t('title')}</h3>
        </div>
        {hasPhotos && (
          <span className="label-caps text-muted tabular-nums print-hidden">
            {photos.length} / {MAX_PHOTOS_PER_PROPERTY}
          </span>
        )}
      </div>

      {/* Input único; lo disparan el dropzone y el botón "añadir más". */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {/* Zona interactiva: no va al papel (el informe usa el grid de abajo). */}
      <div className="print-hidden">
        {!loaded ? (
          <div className="aspect-[16/10] w-full animate-pulse rounded-card bg-paper" aria-hidden="true" />
        ) : !hasPhotos ? (
          <button
            type="button"
            onClick={openPicker}
            onDragOver={(e) => {
              e.preventDefault()
              setDragActive(true)
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDragActive(false)
              handleFiles(e.dataTransfer.files)
            }}
            disabled={pending}
            className={`flex aspect-[16/10] w-full flex-col items-center justify-center gap-3 rounded-card border-2 border-dashed p-6 text-center transition-colors ${
              dragActive ? 'border-petrol bg-petrol/5' : 'border-hairline bg-paper hover:border-petrol/40 hover:bg-petrol/5'
            } disabled:opacity-60`}
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-petrol shadow-ambient">
              {pending ? <Loader2 size={22} className="animate-spin" /> : <ImagePlus size={22} />}
            </span>
            <span>
              <span className="block font-display text-sm font-semibold text-ink">
                {pending ? t('uploading') : t('addPrompt')}
              </span>
              <span className="mt-1 block text-xs text-muted">{t('uploadHint')}</span>
            </span>
          </button>
        ) : (
          <div
            role="group"
            aria-roledescription="carrusel"
            aria-label={t('carouselAria')}
            tabIndex={0}
            onKeyDown={onKeyDown}
            className="rounded-card outline-none focus-visible:ring-2 focus-visible:ring-petrol/40"
          >
            {/* Anuncio para lectores de pantalla al cambiar de foto (el contador visual es aria-hidden). */}
            <span className="sr-only" role="status" aria-live="polite">
              {t('photoOf', { current: safeCurrent + 1, total: photos.length })}
            </span>
            <div className="relative overflow-hidden rounded-card bg-paper">
              <img
                src={photos[safeCurrent].signedUrl}
                alt={t('photoOf', { current: safeCurrent + 1, total: photos.length })}
                className="aspect-[16/10] w-full object-cover"
              />

              {photos.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={goPrev}
                    aria-label={t('prevPhoto')}
                    className="absolute top-1/2 left-3 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink shadow-ambient transition hover:bg-white"
                  >
                    <ChevronLeft size={18} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={goNext}
                    aria-label={t('nextPhoto')}
                    className="absolute top-1/2 right-3 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink shadow-ambient transition hover:bg-white"
                  >
                    <ChevronRight size={18} aria-hidden="true" />
                  </button>
                </>
              )}

              <span
                aria-hidden="true"
                className="absolute bottom-3 left-3 rounded-full bg-ink/70 px-2.5 py-1 font-display text-xs font-semibold text-white tabular-nums"
              >
                {safeCurrent + 1} / {photos.length}
              </span>

              <button
                type="button"
                onClick={() => setConfirmDeleteId(photos[safeCurrent].id)}
                aria-label={t('deletePhoto')}
                disabled={pending}
                className="absolute top-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-error shadow-ambient transition hover:bg-white disabled:opacity-60"
              >
                <Trash2 size={16} aria-hidden="true" />
              </button>

              {confirmDeleteId && (
                <div
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="confirm-delete-title"
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      e.stopPropagation()
                      setConfirmDeleteId(null)
                    }
                  }}
                  className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-ink/70 px-4 text-center backdrop-blur-sm"
                >
                  <p id="confirm-delete-title" className="font-display text-sm font-semibold text-white">
                    {t('confirmDeleteTitle')}
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => confirmDelete(confirmDeleteId)}
                      disabled={pending}
                      className="flex items-center gap-1.5 rounded-card bg-error px-4 py-2 font-display text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
                    >
                      {pending ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                      {t('delete')}
                    </button>
                    <button
                      ref={cancelDeleteRef}
                      type="button"
                      onClick={() => setConfirmDeleteId(null)}
                      disabled={pending}
                      className="rounded-card bg-white px-4 py-2 font-display text-sm font-semibold text-ink transition hover:bg-paper disabled:opacity-60"
                    >
                      {t('cancel')}
                    </button>
                  </div>
                </div>
              )}

              {pending && !confirmDeleteId && (
                <div className="absolute inset-0 z-10 flex items-center justify-center gap-2 bg-ink/40 font-display text-sm font-semibold text-white backdrop-blur-sm">
                  <Loader2 size={18} className="animate-spin" aria-hidden="true" />
                  {t('uploading')}
                </div>
              )}
            </div>

            {/* Tira de miniaturas + añadir más */}
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {photos.map((p, i) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setCurrent(i)}
                  aria-label={t('viewPhoto', { n: i + 1 })}
                  aria-current={i === safeCurrent}
                  className={`h-14 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                    i === safeCurrent ? 'border-petrol' : 'border-transparent hover:border-hairline'
                  }`}
                >
                  <img src={p.signedUrl} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
              {canAddMore && (
                <button
                  type="button"
                  onClick={openPicker}
                  disabled={pending}
                  aria-label={t('addMore')}
                  className="flex h-14 w-20 shrink-0 items-center justify-center rounded-lg border-2 border-dashed border-hairline text-muted transition hover:border-petrol/40 hover:text-petrol disabled:opacity-60"
                >
                  <ImagePlus size={18} aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Versión imprimible: hasta 3 fotos en grid, sin controles. */}
      {hasPhotos && (
        <div className="hidden gap-2 print:grid print:grid-cols-3">
          {photos.slice(0, 3).map((p, i) => (
            <img
              key={p.id}
              src={p.signedUrl}
              alt={t('photoOf', { current: i + 1, total: photos.length })}
              className="aspect-[4/3] w-full rounded-lg object-cover"
            />
          ))}
        </div>
      )}

      {error && (
        <div
          className="mt-4 flex items-start gap-2.5 rounded-card border border-error/25 bg-error/5 p-4 text-sm text-error print-hidden"
          role="alert"
        >
          <AlertCircle size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
          <p>{error}</p>
        </div>
      )}
    </section>
  )
}
