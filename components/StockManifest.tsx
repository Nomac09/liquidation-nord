'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { Reveal } from '@/components/motion'

const LABELS: Record<string, string> = {
  Mobilier: 'Mobilier',
  Bazar: 'Bazar & Déco',
  Bricolage: 'Bricolage',
  Textile: 'Textile',
}

const ORDER = ['Mobilier', 'Bazar', 'Bricolage', 'Textile']
const ANCHOR_PCT = 17
const FLOOR_PCT = 11

// Segments are sized by live stock count, not fixed equal widths — the bar
// itself reflects what's actually in stock right now, with a legibility
// floor so a thin category never disappears entirely. No numbers are
// printed — width alone carries the weighting.
function computeWidths(counts: Record<string, number>) {
  const cats = ORDER.filter((c) => (counts[c] || 0) > 0)
  const total = cats.reduce((s, c) => s + (counts[c] || 0), 0)
  const available = 100 - ANCHOR_PCT
  if (total === 0 || cats.length === 0) return cats.map((c) => ({ category: c, pct: available / Math.max(cats.length, 1) }))

  const raw = cats.map((c) => ({ category: c, pct: ((counts[c] || 0) / total) * available }))
  const below = raw.filter((r) => r.pct < FLOOR_PCT)
  const above = raw.filter((r) => r.pct >= FLOOR_PCT)
  const floorSum = below.length * FLOOR_PCT
  const aboveRawSum = above.reduce((s, r) => s + r.pct, 0)
  const remainderForAbove = available - floorSum

  return raw.map((r) => {
    if (r.pct < FLOOR_PCT) return { category: r.category, pct: FLOOR_PCT }
    const share = aboveRawSum > 0 ? r.pct / aboveRawSum : 0
    return { category: r.category, pct: remainderForAbove * share }
  })
}

function Ticks() {
  return (
    <span aria-hidden className="pointer-events-none absolute inset-y-0 right-0 flex items-stretch gap-[3px] pr-2 opacity-25">
      {[3, 1, 2, 1, 3, 1, 2].map((w, i) => (
        <span key={i} className="bg-current" style={{ width: w }} />
      ))}
    </span>
  )
}

function ManifestInner({ counts }: { counts: Record<string, number> }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const activeCategory = pathname === '/' ? searchParams.get('category') : null
  const widths = computeWidths(counts)

  return (
    <div>
      <p className="tag-label mb-2 text-gris">Parcourir par catégorie</p>

      <div
        role="tablist"
        aria-label="Filtrer par catégorie"
        className="flex h-14 w-full overflow-hidden rounded-lg border border-ligne sm:h-16"
      >
        <Link
          href="/"
          role="tab"
          aria-selected={!activeCategory}
          style={{ width: `${ANCHOR_PCT}%` }}
          className={`relative flex shrink-0 items-center px-3 font-mono text-[10px] uppercase tracking-widest transition-colors sm:px-4 sm:text-[11px] ${
            !activeCategory ? 'bg-encre text-blanc' : 'bg-encre/95 text-blanc hover:bg-encre'
          }`}
        >
          Tout
          <Ticks />
        </Link>

        {widths.map(({ category, pct }, i) => {
          const active = activeCategory === category
          return (
            <Link
              key={category}
              href={`/?category=${category}`}
              role="tab"
              aria-selected={active}
              style={{ width: `${pct}%` }}
              className={`relative flex shrink-0 items-center truncate border-l border-ligne px-3 font-mono text-[10px] uppercase tracking-widest transition-colors sm:px-4 sm:text-[11px] ${
                active
                  ? 'bg-bleu text-blanc'
                  : i % 2 === 0
                    ? 'bg-blanc text-encre hover:bg-beton'
                    : 'bg-beton/60 text-encre hover:bg-beton'
              }`}
            >
              {LABELS[category] || category}
              {active && <Ticks />}
            </Link>
          )
        })}
      </div>
    </div>
  )
}

export default function StockManifest({ counts }: { counts: Record<string, number> }) {
  return (
    <Reveal>
      <Suspense fallback={<div className="h-14 sm:h-16" />}>
        <ManifestInner counts={counts} />
      </Suspense>
    </Reveal>
  )
}
