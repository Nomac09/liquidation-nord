'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { EASE } from '@/components/motion'

// The one orchestrated moment: micro-label → headline lines clip-reveal →
// the −50% sticker springs in → manifest stat row settles.
export default function Hero({
  total,
  mobilier,
  bazar,
}: {
  total: number
  mobilier: number
  bazar: number
}) {
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
          Arrivages en cours · Retours vidaXL · Bondues, Nord
        </motion.p>

        <h1 className="mt-5 max-w-3xl font-display text-4xl font-bold leading-[1.05] tracking-tight text-encre sm:text-6xl">
          <span className="block overflow-hidden pb-1">
            <motion.span className="block" {...line(0.15)}>
              Du vrai mobilier,
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
          Parcourez la palette, repérez votre pièce, récupérez-la à l’entrepôt ou
          faites-vous livrer. Un seul exemplaire de chaque — quand c’est parti,
          c’est parti.
        </motion.p>

        <motion.dl
          className="mt-10 grid max-w-2xl grid-cols-3 divide-x divide-ligne border-y border-ligne"
          {...fade(0.9)}
        >
          {[
            { label: 'pièces en stock', value: total },
            { label: 'meubles & jardin', value: mobilier },
            { label: 'bazar & déco', value: bazar },
          ].map((stat) => (
            <div key={stat.label} className="px-4 py-4 first:pl-0">
              <dt className="order-2 font-mono text-[11px] uppercase tracking-widest text-gris">
                {stat.label}
              </dt>
              <dd className="font-display text-2xl font-bold text-bleu sm:text-3xl">
                {stat.value}
              </dd>
            </div>
          ))}
        </motion.dl>
      </div>
    </section>
  )
}
