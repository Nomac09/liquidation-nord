'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { EASE } from '@/components/motion'

interface DropPhoto {
  url: string
  name: string
}

// One dominant photograph anchors the arrival, with a considered quartet
// of supporting images at a consistent, cover-filled frame — a hero and
// its supporting cast, not a uniform contact sheet of equal-weight tiles.
// Cover-fit (not contain) is deliberate here: this is editorial/atmospheric
// photography, not a product listing where the exact uncropped item matters.
export default function DropModule({
  dateLabel,
  remaining,
  total,
  brand,
  photos,
}: {
  dateLabel: string | null
  remaining: number
  total: number
  brand: string | null
  photos: DropPhoto[]
}) {
  const reduce = useReducedMotion()
  const pct = total > 0 ? Math.min(100, (remaining / total) * 100) : 0
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
        <motion.div
          className="grid gap-8 sm:grid-cols-[1.3fr_1fr] sm:items-end sm:gap-14"
          {...fade(0.05)}
        >
          <div>
            {dateLabel && (
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-dust">
                Arrivage du {dateLabel}
                {brand ? ` — ${brand}` : ''}
              </p>
            )}
            <h1
              className="mt-3 font-serif text-4xl leading-[1.12] tracking-tight text-ink sm:text-6xl"
              style={{ textWrap: 'balance' }}
            >
              {remaining} pièce{remaining > 1 ? 's' : ''}{' '}
              <em className="italic text-verdigris-deep">n’existent qu’une fois.</em>
            </h1>
          </div>

          <div className="sm:text-right">
            <p className="font-mono text-[15px] tabular-nums text-ink">
              <span className="font-medium">{remaining}</span>{' '}
              <span className="text-dust">disponibles / {total}</span>
            </p>
            <div className="mt-2.5 h-[2px] w-full max-w-[220px] bg-hairline sm:ml-auto">
              <div className="h-full bg-verdigris" style={{ width: `${pct}%` }} />
            </div>
            <p className="mt-2 max-w-[220px] text-xs leading-relaxed text-dust sm:ml-auto">
              Chaque vente retire la pièce du catalogue — sans réassort.
            </p>
          </div>
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
  photo: DropPhoto
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
          className="absolute inset-x-0 bottom-0 p-3 font-mono text-[10px] uppercase tracking-wide text-blanc opacity-0 transition-opacity duration-200 group-hover:opacity-100"
          style={{ textShadow: '0 1px 6px rgba(0,0,0,.45)' }}
        >
          {photo.name}
        </figcaption>
      )}
    </figure>
  )
}
