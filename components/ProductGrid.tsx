'use client'

import { useEffect, useState, useTransition } from 'react'
import { motion, gridContainer, gridItem, EASE, useReducedMotion } from '@/components/motion'
import TicketRow from '@/components/TicketRow'
import RegistreRow from '@/components/RegistreRow'
import { useViewMode } from '@/lib/viewMode'
import type { CatalogProduct } from '@/components/ProductCard'
import { Loader2 } from 'lucide-react'

const PAGE_SIZE = 24

function cacheKeyFor(opts: {
  category?: string
  search?: string
  priceMin?: string
  priceMax?: string
  material?: string
  color?: string
}) {
  return `souqify-grid-${opts.category || ''}|${opts.search || ''}|${opts.priceMin || ''}|${opts.priceMax || ''}|${opts.material || ''}|${opts.color || ''}`
}

export default function ProductGrid({
  initialItems,
  total,
  category,
  search,
  priceMin,
  priceMax,
  material,
  color,
}: {
  initialItems: CatalogProduct[]
  total: number
  category?: string
  search?: string
  priceMin?: string
  priceMax?: string
  material?: string
  color?: string
}) {
  const cacheKey = cacheKeyFor({ category, search, priceMin, priceMax, material, color })

  // On mount, prefer whatever was previously loaded for this exact filter
  // combination over the server's first page — this is what makes "load
  // more, open a product, hit back" restore the full list instead of
  // resetting to page one. Read synchronously (useState initializer) so
  // there's no flash of the short list before the restore kicks in.
  const [items, setItems] = useState<CatalogProduct[]>(() => {
    if (typeof window === 'undefined') return initialItems
    try {
      const raw = sessionStorage.getItem(cacheKey)
      if (!raw) return initialItems
      const cached = JSON.parse(raw) as { items: CatalogProduct[] }
      return cached.items?.length >= initialItems.length ? cached.items : initialItems
    } catch {
      return initialItems
    }
  })
  const [initialCount] = useState(initialItems.length)
  const [restored] = useState(() => items.length > initialItems.length)
  const [pending, startTransition] = useTransition()
  const reduce = useReducedMotion()
  const { mode, setMode } = useViewMode()

  // Persist the loaded list as it grows.
  useEffect(() => {
    try {
      sessionStorage.setItem(cacheKey, JSON.stringify({ items }))
    } catch {
      /* sessionStorage full or unavailable — restoration just won't work this time */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items])

  // Restore scroll position once, after the (possibly longer, restored)
  // list has painted — otherwise the page may not be tall enough yet to
  // scroll to where the user left off.
  useEffect(() => {
    if (!restored) return
    const raw = sessionStorage.getItem(`${cacheKey}-scroll`)
    const y = raw ? Number(raw) : 0
    if (!y) return
    const id = requestAnimationFrame(() => window.scrollTo(0, y))
    return () => cancelAnimationFrame(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Save scroll position continuously (cheap, passive) so whatever it was
  // right before navigating away is what gets restored.
  useEffect(() => {
    const onScroll = () => {
      sessionStorage.setItem(`${cacheKey}-scroll`, String(window.scrollY))
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadMore = () => {
    startTransition(async () => {
      const params = new URLSearchParams({
        skip: String(items.length),
        limit: String(PAGE_SIZE),
      })
      if (category) params.set('category', category)
      if (search) params.set('search', search)
      if (priceMin) params.set('priceMin', priceMin)
      if (priceMax) params.set('priceMax', priceMax)
      if (material) params.set('material', material)
      if (color) params.set('color', color)
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
    <div>
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
        variants={reduce || restored ? undefined : gridContainer}
        initial={reduce || restored ? undefined : 'hidden'}
        // A restored scroll position can jump straight past this batch
        // without ever scrolling it into view — whileInView would then
        // never fire and it'd sit at opacity 0 forever, so restores skip
        // straight to the "shown" state instead of waiting to be seen.
        animate={restored ? 'show' : undefined}
        whileInView={reduce || restored ? undefined : 'show'}
        viewport={{ once: true, margin: '-20px' }}
      >
        {items.slice(0, initialCount).map((product) => (
          <motion.li key={product._id} variants={reduce || restored ? undefined : gridItem}>
            <Row product={product} />
          </motion.li>
        ))}
      </motion.ul>

      {items.length > initialCount && (
        // Items loaded via "load more" mount well after the container's
        // whileInView already fired (and won't re-fire, once: true) — so
        // these animate on mount directly instead of relying on variant
        // propagation from an ancestor that's done animating. Restored
        // items (coming back from a product page) skip the entrance
        // animation entirely — animating in 40+ items on every back
        // navigation reads as slow, not as a fresh reveal.
        <ul className={`mt-3 ${listClass}`}>
          {items.slice(initialCount).map((product, i) => (
            <motion.li
              key={product._id}
              initial={reduce || restored ? undefined : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={reduce || restored ? { duration: 0 } : { duration: 0.5, ease: EASE, delay: (i % PAGE_SIZE) * 0.03 }}
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
    </div>
  )
}
