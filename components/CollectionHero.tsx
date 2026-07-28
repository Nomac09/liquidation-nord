'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { EASE } from '@/components/motion'

interface CollectionPhoto {
  url: string
  name: string
}

// Presents the standing collection — a calm, evergreen boutique front,
// not a dated "arrival" announcement. No count, no countdown, no "only
// one exists" framing: the one-of-one/first-payment-wins mechanics are
// still exactly how the catalogue behaves underneath, they're just not
// dressed up as a scarcity event here.
//
// One dominant photograph anchors the section, with a considered quartet
// of supporting images at a consistent, cover-filled frame — a hero and
// its supporting cast, not a uniform contact sheet of equal-weight tiles.
// Cover-fit (not contain) is deliberate here: this is editorial/atmospheric
// photography, not a product listing where the exact uncropped item matters.
export default function CollectionHero({
  brand,
  photos,
}: {
  brand: string | null
  photos: CollectionPhoto[]
}) {
  const reduce = useReducedMotion()
  const gallery = photos.slice(0, 5)
  const [feature, b, c, d, e] = gallery

  const fade = (delay: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 12 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.6, delay, ease: EASE },
        }

  return (
    <section className="bg-stone">
      <div className="container mx-auto px-4 py-14 sm:py-20">
        <motion.div className="max-w-2xl" {...fade(0.05)}>
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-dust">
            Bondues (59) · Nord
          </p>
          <h1
            className="mt-3 font-serif text-4xl leading-[1.12] tracking-tight text-ink sm:text-6xl"
            style={{ textWrap: 'balance' }}
          >
            Jardin, mobilier et déco{brand ? ` ${brand}` : ''}, à moitié prix.
          </h1>
          <p className="mt-5 max-w-md font-karla text-[15px] leading-relaxed text-dust">
            Chaque pièce est inspectée à l’entrepôt avant sa mise en ligne — retrait
            gratuit sur place ou livraison partout en France.
          </p>
        </motion.div>

        {gallery.length >= 5 && (
          <motion.div
            className="mt-11 grid grid-cols-2 gap-3 sm:grid-cols-12 sm:gap-5 sm:[grid-template-rows:repeat(2,220px)]"
            {...fade(0.18)}
          >
            <GalleryFigure
              photo={feature}
              className="col-span-2 aspect-[16/10] sm:col-start-1 sm:col-span-6 sm:row-start-1 sm:row-span-2 sm:aspect-auto"
              showCaption={false}
            />
            <GalleryFigure
              photo={b}
              className="aspect-square sm:col-start-7 sm:col-span-3 sm:row-start-1 sm:row-span-1 sm:aspect-auto"
            />
            <GalleryFigure
              photo={c}
              className="aspect-square sm:col-start-10 sm:col-span-3 sm:row-start-1 sm:row-span-1 sm:aspect-auto"
            />
            <GalleryFigure
              photo={d}
              className="aspect-square sm:col-start-7 sm:col-span-3 sm:row-start-2 sm:row-span-1 sm:aspect-auto"
            />
            <GalleryFigure
              photo={e}
              className="aspect-square sm:col-start-10 sm:col-span-3 sm:row-start-2 sm:row-span-1 sm:aspect-auto"
            />
          </motion.div>
        )}
      </div>
    </section>
  )
}

function GalleryFigure({
  photo,
  className,
  showCaption = true,
}: {
  photo: CollectionPhoto
  className: string
  showCaption?: boolean
}) {
  return (
    <figure className={`group relative overflow-hidden bg-paper ${className}`}>
      <img
        src={photo.url}
        alt={photo.name}
        loading="eager"
        className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
      />
      {showCaption && (
        <figcaption
          className="absolute inset-x-0 bottom-0 p-3 font-mono text-[10px] uppercase tracking-wide text-[#F6F5F1] opacity-0 transition-opacity duration-200 group-hover:opacity-100"
          style={{ textShadow: '0 1px 6px rgba(0,0,0,.45)' }}
        >
          {photo.name}
        </figcaption>
      )}
    </figure>
  )
}
