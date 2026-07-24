'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { EASE } from '@/components/motion'
import StockManifest from '@/components/StockManifest'

// The one orchestrated moment: micro-label → headline lines clip-reveal →
// the −50% sticker springs in. The category manifest bar lives inside this
// same block (a dashed rule below the lede, not a separate section) so the
// arrivage framing and the category tally read as one ledger unit rather
// than "hero banner, then unrelated nav widget."
export default function Hero({ counts }: { counts: Record<string, number> }) {
  const reduce = useReducedMotion()

  const line = (delay: number) =>
    reduce
      ? {}
      : {
          initial: { y: '110%' },
          animate: { y: 0 },
          transition: { duration: 0.7, delay, ease: EASE },
        }

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
      <div className="container mx-auto px-4 py-14 sm:py-20">
        <motion.p className="tag-label" {...fade(0.05)}>
          Nouveaux arrivages · Bondues, Nord
        </motion.p>

        <h1 className="mt-5 max-w-3xl font-display text-4xl font-bold leading-[1.05] tracking-tight text-encre sm:text-6xl">
          <span className="block overflow-hidden pb-1">
            <motion.span className="block" {...line(0.15)}>
              Du mobilier vidaXL,
            </motion.span>
          </span>
          <span className="block overflow-hidden pb-1">
            <motion.span className="block" {...line(0.27)}>
              à{' '}
              <motion.span
                className="sticker relative -top-1 text-3xl sm:text-5xl"
                initial={reduce ? undefined : { scale: 1.6, rotate: -14, opacity: 0 }}
                animate={{ scale: 1, rotate: -3, opacity: 1 }}
                transition={
                  reduce
                    ? undefined
                    : { type: 'spring', stiffness: 260, damping: 18, delay: 0.75 }
                }
              >
                moitié prix.
              </motion.span>
            </motion.span>
          </span>
        </h1>

        <motion.p className="mt-6 max-w-xl text-lg leading-relaxed text-gris" {...fade(0.5)}>
          Parcourez la sélection, repérez votre pièce, récupérez-la à
          l’entrepôt ou faites-vous livrer. Un seul exemplaire de chaque —
          quand c’est parti, c’est parti.
        </motion.p>

        <div className="mt-10 border-t border-dashed border-ligne pt-6">
          <StockManifest counts={counts} />
        </div>
      </div>
    </section>
  )
}
