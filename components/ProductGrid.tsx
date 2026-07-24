'use client'

import { useState, useTransition } from 'react'
import { motion, gridContainer, gridItem, EASE, useReducedMotion } from '@/components/motion'
import ProductCard, { type CatalogProduct } from '@/components/ProductCard'
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

  return (
    <>
      <motion.ul
        className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 xl:grid-cols-4"
        variants={reduce ? undefined : gridContainer}
        initial={reduce ? undefined : 'hidden'}
        whileInView={reduce ? undefined : 'show'}
        viewport={{ once: true, margin: '-20px' }}
      >
        {items.slice(0, initialCount).map((product) => (
          <motion.li key={product._id} variants={reduce ? undefined : gridItem}>
            <ProductCard product={product} />
          </motion.li>
        ))}
      </motion.ul>

      {items.length > initialCount && (
        // Items loaded via "load more" mount well after the container's
        // whileInView already fired (and won't re-fire, once: true) — so
        // these animate on mount directly instead of relying on variant
        // propagation from an ancestor that's done animating.
        <ul className="mt-3 grid grid-cols-2 gap-3 sm:mt-5 sm:gap-5 md:grid-cols-3 xl:grid-cols-4">
          {items.slice(initialCount).map((product, i) => (
            <motion.li
              key={product._id}
              initial={reduce ? undefined : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={reduce ? undefined : { duration: 0.5, ease: EASE, delay: (i % PAGE_SIZE) * 0.03 }}
            >
              <ProductCard product={product} />
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
