'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ChevronLeft, ChevronRight, ImageOff, X, ZoomIn } from 'lucide-react'
import { EASE } from '@/components/motion'

const SWIPE_THRESHOLD = 40

export default function ImageGallery({
  photos = [],
  productName = 'Produit',
}: {
  photos?: string[]
  productName?: string
}) {
  const validPhotos = (Array.isArray(photos) ? photos : []).filter(Boolean)
  const [selected, setSelected] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const reduce = useReducedMotion()
  const touchStartX = useRef(0)

  const hasMultiple = validPhotos.length > 1

  const go = (delta: number) => {
    setSelected((i) => (i + delta + validPhotos.length) % validPhotos.length)
  }

  useEffect(() => {
    if (!lightboxOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxOpen(false)
      if (e.key === 'ArrowLeft') go(-1)
      if (e.key === 'ArrowRight') go(1)
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lightboxOpen, validPhotos.length])

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }
  const onTouchEnd = (e: React.TouchEvent) => {
    const delta = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(delta) < SWIPE_THRESHOLD) return
    go(delta < 0 ? 1 : -1)
  }

  if (validPhotos.length === 0) {
    return (
      <div className="flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-xl border border-ligne bg-blanc text-gris">
        <ImageOff aria-hidden className="h-8 w-8" />
        <span className="font-mono text-[11px] uppercase tracking-widest">
          Photo à venir — demandez-la nous
        </span>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => setLightboxOpen(true)}
        aria-label="Agrandir la photo"
        className="group relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-ligne bg-blanc"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.img
            key={selected}
            src={validPhotos[selected]}
            alt={`${productName} — photo ${selected + 1} sur ${validPhotos.length}`}
            className="h-full w-full object-contain"
            initial={reduce ? false : { opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={reduce ? undefined : { opacity: 0 }}
            transition={{ duration: 0.25 }}
          />
        </AnimatePresence>
        <span className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-encre/70 px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-widest text-blanc opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
          <ZoomIn aria-hidden className="h-3 w-3" />
          Agrandir
        </span>
      </button>

      {validPhotos.length > 1 && (
        <div className="grid grid-cols-5 gap-2 sm:grid-cols-6">
          {validPhotos.map((photo, index) => (
            <button
              key={index}
              onClick={() => setSelected(index)}
              aria-label={`Voir la photo ${index + 1}`}
              aria-current={selected === index}
              className={`aspect-square overflow-hidden rounded-lg border-2 bg-blanc transition-colors ${
                selected === index ? 'border-bleu' : 'border-ligne hover:border-gris'
              }`}
            >
              <img
                src={photo}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      <AnimatePresence>
        {lightboxOpen && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={`${productName} — photo agrandie`}
            className="fixed inset-0 z-50 flex items-center justify-center bg-encre/95 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={() => setLightboxOpen(false)}
          >
            <button
              type="button"
              onClick={() => setLightboxOpen(false)}
              aria-label="Fermer"
              className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-blanc/10 text-blanc transition-colors hover:bg-blanc/20"
            >
              <X aria-hidden className="h-5 w-5" />
            </button>

            {hasMultiple && (
              <span className="absolute left-1/2 top-4 -translate-x-1/2 font-mono text-[11px] uppercase tracking-widest text-blanc/70">
                {selected + 1} / {validPhotos.length}
              </span>
            )}

            {hasMultiple && (
              <button
                type="button"
                aria-label="Photo précédente"
                onClick={(e) => {
                  e.stopPropagation()
                  go(-1)
                }}
                className="absolute left-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-blanc/10 text-blanc transition-colors hover:bg-blanc/20 sm:left-6"
              >
                <ChevronLeft aria-hidden className="h-6 w-6" />
              </button>
            )}

            <motion.img
              key={selected}
              src={validPhotos[selected]}
              alt={`${productName} — photo ${selected + 1} sur ${validPhotos.length}`}
              className="max-h-[85vh] max-w-[90vw] object-contain"
              initial={reduce ? false : { opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2, ease: EASE }}
              onClick={(e) => e.stopPropagation()}
              onTouchStart={onTouchStart}
              onTouchEnd={onTouchEnd}
            />

            {hasMultiple && (
              <button
                type="button"
                aria-label="Photo suivante"
                onClick={(e) => {
                  e.stopPropagation()
                  go(1)
                }}
                className="absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-blanc/10 text-blanc transition-colors hover:bg-blanc/20 sm:right-6"
              >
                <ChevronRight aria-hidden className="h-6 w-6" />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
