'use client'

import { useState, useTransition } from 'react'
import { motion, gridContainer, gridItem, EASE, useReducedMotion } from '@/components/motion'
import TicketRow from '@/components/TicketRow'
import RegistreRow from '@/components/RegistreRow'
import { useViewMode } from '@/lib/viewMode'
import type { CatalogProduct } from '@/components/ProductCard'
import { Loader2 } from 'lucide-react'

const PAGE_SIZE = 24

export default function ProductGrid({
  initialItems,
  total,
  category,
  search,
}: {
  initialItems: CatalogProduct[]
  total: number
  category?: string
  search?: string
}) {
  const [items, setItems] = useState(initialItems)
  const [initialCount] = useState(initialItems.length)
  const [pending, startTransition] = useTransition()
  const reduce = useReducedMotion()
  const { mode, setMode } = useViewMode()

  const loadMore = () => {
    startTransition(async () => {
      const params = new URLSearchParams({
        skip: String(items.length),
        limit: String(PAGE_SIZE),
      })
      if (category) params.set('category', category)
      if (search) params.set('search', search)
      const res = await fetch(`/api/products?${params}`)
      if (!res.ok) return
      const data = await res.json()
      const next: CatalogProduct[] = Array.isArray(data) ? data : data.items
      setItems((prev) => {
        const seen = new Set(prev.map((p) => p._id))
        return [...prev, ...next.filter((p) => !seen.has(p._id))]
      })
    })
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-ligne bg-blanc/60 py-16 text-center">
        <p className="font-display text-xl font-semibold text-encre">
          Rien ne correspond à votre recherche.
        </p>
        <p className="mt-2 text-sm text-gris">
          Essayez un autre mot-clé, ou parcourez tout l’arrivage — la sélection se renouvelle régulièrement.
        </p>
      </div>
    )
  }

  const listClass =
    mode === 'tickets'
      ? 'flex flex-col gap-3 md:grid md:grid-cols-2 md:gap-4'
      : 'border border-ligne bg-blanc px-4 lg:grid lg:grid-cols-2 lg:gap-x-8'
  const Row = mode === 'tickets' ? TicketRow : RegistreRow

  return (
    <>
      <div className="mb-4 flex items-center justify-end">
        <div
          role="tablist"
          aria-label="Mode d’affichage"
          className="inline-flex overflow-hidden rounded-full border border-ligne font-mono text-[10px] uppercase tracking-widest"
        >
          <button
            role="tab"
            aria-selected={mode === 'tickets'}
            onClick={() => setMode('tickets')}
            className={`px-3 py-1.5 transition-colors ${mode === 'tickets' ? 'bg-encre text-blanc' : 'text-encre hover:bg-beton'}`}
          >
            Tickets
          </button>
          <button
            role="tab"
            aria-selected={mode === 'registre'}
            onClick={() => setMode('registre')}
            className={`border-l border-ligne px-3 py-1.5 transition-colors ${mode === 'registre' ? 'bg-encre text-blanc' : 'text-encre hover:bg-beton'}`}
          >
            Registre
          </button>
        </div>
      </div>

      <motion.ul
        className={listClass}
        variants={reduce ? undefined : gridContainer}
        initial={reduce ? undefined : 'hidden'}
        whileInView={reduce ? undefined : 'show'}
        viewport={{ once: true, margin: '-20px' }}
      >
        {items.slice(0, initialCount).map((product) => (
          <motion.li key={product._id} variants={reduce ? undefined : gridItem}>
            <Row product={product} />
          </motion.li>
        ))}
      </motion.ul>

      {items.length > initialCount && (
        // Items loaded via "load more" mount well after the container's
        // whileInView already fired (and won't re-fire, once: true) — so
        // these animate on mount directly instead of relying on variant
        // propagation from an ancestor that's done animating.
        <ul className={`mt-3 ${listClass}`}>
          {items.slice(initialCount).map((product, i) => (
            <motion.li
              key={product._id}
              initial={reduce ? undefined : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={reduce ? undefined : { duration: 0.5, ease: EASE, delay: (i % PAGE_SIZE) * 0.03 }}
            >
              <Row product={product} />
            </motion.li>
          ))}
        </ul>
      )}

      {items.length < total && (
        <div className="mt-10 flex flex-col items-center gap-3">
          <button
            onClick={loadMore}
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-full bg-bleu px-8 py-3 text-sm font-semibold text-blanc transition-colors hover:bg-bleu-deep disabled:opacity-60"
          >
            {pending && <Loader2 aria-hidden className="h-4 w-4 animate-spin" />}
            {pending ? 'Chargement…' : 'Voir plus de pièces'}
          </button>
        </div>
      )}
    </>
  )
}
