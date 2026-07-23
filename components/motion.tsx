'use client'

import { motion, useReducedMotion, type Variants } from 'framer-motion'

export const EASE = [0.22, 1, 0.36, 1] as const

// Scroll-triggered reveal: fades/slides children in once, staggered.
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode
  delay?: number
  className?: string
}) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.55, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  )
}

export const gridContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.045 } },
}

export const gridItem: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
}

export { motion, useReducedMotion }
