'use client'

import Link from 'next/link'
import { ShoppingBag, User } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { AnimatePresence, motion } from 'framer-motion'
import { useReducedMotion } from '@/components/motion'
import { useCart } from '@/lib/cart'
import { useUI } from '@/lib/ui'
import { BRAND_SYLLABLE_SPLIT } from '@/lib/brand'

// The category tab row that used to live here is gone — the manifest bar
// (rendered sitewide, directly below this header) is now the only
// navigation instrument, not a nav plus a decorative widget.
export default function Header() {
  const { items } = useCart()
  const { openCart } = useUI()
  const { data: session, status } = useSession()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const count = mounted ? items.reduce((s, i) => s + i.quantity, 0) : 0
  const reduce = useReducedMotion()

  return (
    <header className="sticky top-0 z-40 border-b border-hairline bg-surface/92 backdrop-blur">
      <div className="container mx-auto flex items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="shrink-0 leading-none" aria-label={`${BRAND_SYLLABLE_SPLIT.lead}${BRAND_SYLLABLE_SPLIT.tail} — accueil`}>
          <span className="font-display text-xl italic tracking-tight text-ink">
            {BRAND_SYLLABLE_SPLIT.lead}<span className="text-verdigris-deep">{BRAND_SYLLABLE_SPLIT.tail}</span>
          </span>
          <span className="mt-0.5 block font-mono text-[10px] uppercase tracking-[0.18em] text-dust">
            Déstockage · Bondues (59)
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href={status === 'authenticated' ? '/account' : '/login'}
            className="flex items-center gap-2 rounded-full border border-hairline px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-verdigris hover:text-verdigris-deep"
          >
            <User aria-hidden className="h-4 w-4" />
            <span className="hidden sm:inline">
              {status === 'authenticated'
                ? (session?.user?.name?.split(' ')[0] || 'Mon compte')
                : 'Se connecter'}
            </span>
          </Link>

          <button
            onClick={openCart}
            className="relative flex items-center gap-2 rounded-full border border-hairline px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-verdigris hover:text-verdigris-deep"
            aria-label={`Ouvrir le panier, ${count} article${count > 1 ? 's' : ''}`}
          >
            <ShoppingBag aria-hidden className="h-4 w-4" />
            <span className="hidden sm:inline">Panier</span>
            <AnimatePresence>
              {count > 0 && (
                <motion.span
                  key={reduce ? 'badge' : count}
                  initial={reduce ? false : { scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                  className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-verdigris px-1 font-mono text-[11px] font-semibold text-stone"
                >
                  {count}
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </div>
    </header>
  )
}
