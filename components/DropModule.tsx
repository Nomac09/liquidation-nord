'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { EASE } from '@/components/motion'

interface DropPhoto {
  url: string
  name: string
}

// Replaces the old marketing hero. This is the first entry of the
// registry, not a banner — a dated, counted fact about the current
// arrival, illustrated with real pieces from it. No stock photography,
// no slogan.
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

  const fade = (delay: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 10 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.5, delay, ease: EASE },
        }

  return (
    <section className="border-b border-ligne bg-blanc">
      <div className="container mx-auto px-4 py-8 sm:py-10">
        <motion.div className="flex flex-wrap items-end justify-between gap-3" {...fade(0.05)}>
          <div>
            {dateLabel && (
              <p className="font-mono text-[10px] uppercase tracking-widest text-gris">
                Arrivage du {dateLabel}
              </p>
            )}
            <h1 className="mt-1.5 font-display text-2xl font-bold tracking-tight text-encre sm:text-4xl">
              {remaining} pièce{remaining > 1 ? 's' : ''} restante{remaining > 1 ? 's' : ''}
              <span className="text-gris"> sur {total}</span>
            </h1>
          </div>
          {brand && (
            <p className="font-mono text-[11px] uppercase tracking-widest text-gris">
              {brand} · Bondues, Nord
            </p>
          )}
        </motion.div>

        {photos.length > 0 && (
          <motion.div
            className="mt-6 grid grid-cols-8 gap-1 sm:mt-8 sm:gap-1.5"
            {...fade(0.15)}
          >
            {photos.map((p, i) => (
              <div key={i} className="aspect-square overflow-hidden rounded border border-ligne bg-beton">
                <img src={p.url} alt={p.name} loading="eager" className="h-full w-full object-cover" />
              </div>
            ))}
          </motion.div>
        )}
      </div>
    </section>
  )
}
