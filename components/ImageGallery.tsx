'use client'

import { useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ImageOff } from 'lucide-react'

export default function ImageGallery({
  photos = [],
  productName = 'Produit',
}: {
  photos?: string[]
  productName?: string
}) {
  const validPhotos = (Array.isArray(photos) ? photos : []).filter(Boolean)
  const [selected, setSelected] = useState(0)
  const reduce = useReducedMotion()

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
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-ligne bg-blanc">
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
      </div>

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
    </div>
  )
}
