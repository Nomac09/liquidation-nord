'use client'

import { useState, useTransition } from 'react'
import { motion, gridContainer, gridItem, useReducedMotion } from '@/components/motion'
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
          Essayez un autre mot-clé, ou parcourez tout l’arrivage — il se renouvelle à chaque palette.
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
        {items.map((product) => (
          <motion.li key={product._id} variants={reduce ? undefined : gridItem}>
            <ProductCard product={product} />
          </motion.li>
        ))}
      </motion.ul>

      {items.length < total && (
        <div className="mt-10 flex flex-col items-center gap-3">
          <p className="font-mono text-[11px] uppercase tracking-widest text-gris">
            {items.length} / {total} pièces affichées
          </p>
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
