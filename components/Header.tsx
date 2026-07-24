'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { Search, ShoppingBag, User } from 'lucide-react'
import { Suspense, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useCart } from '@/lib/cart'
import { useUI } from '@/lib/ui'
import { BRAND_SYLLABLE_SPLIT } from '@/lib/brand'

const CATEGORIES = [
  { label: 'Mobilier', value: 'Mobilier' },
  { label: 'Bazar & Déco', value: 'Bazar' },
  { label: 'Bricolage', value: 'Bricolage' },
  { label: 'Textile', value: 'Textile' },
]

// Deliberately understated: plain mono-caps text links, no pills or tabs.
// The homepage's StockManifest is where category browsing gets its visual
// weight — this row is just a utility way to jump categories from any page.
function CategoryNav() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const active = pathname === '/' ? searchParams.get('category') : null

  return (
    <nav aria-label="Catégories" className="overflow-x-auto">
      <ul className="flex items-center gap-3 whitespace-nowrap font-mono text-[11px] uppercase tracking-widest">
        <li>
          <Link
            href="/"
            className={`inline-block py-2 transition-colors ${
              pathname === '/' && !active ? 'text-bleu' : 'text-gris hover:text-encre'
            }`}
          >
            Tout
          </Link>
        </li>
        {CATEGORIES.map((c) => (
          <li key={c.value} className="flex items-center gap-3">
            <span aria-hidden className="text-ligne">
              ·
            </span>
            <Link
              href={`/?category=${c.value}`}
              className={`inline-block py-2 transition-colors ${
                active === c.value ? 'text-bleu' : 'text-gris hover:text-encre'
              }`}
            >
              {c.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export default function Header() {
  const { items } = useCart()
  const { openCart } = useUI()
  const { data: session, status } = useSession()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const count = mounted ? items.reduce((s, i) => s + i.quantity, 0) : 0

  return (
    <header className="sticky top-0 z-40 border-b border-ligne bg-blanc/95 backdrop-blur">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between gap-4 py-3">
          <Link href="/" className="shrink-0 leading-none" aria-label={`${BRAND_SYLLABLE_SPLIT.lead}${BRAND_SYLLABLE_SPLIT.tail} — accueil`}>
            <span className="font-display text-xl font-bold tracking-tight text-encre">
              {BRAND_SYLLABLE_SPLIT.lead}<span className="text-bleu">{BRAND_SYLLABLE_SPLIT.tail}</span>
            </span>
            <span className="mt-0.5 block font-mono text-[10px] uppercase tracking-[0.18em] text-gris">
              Déstockage · Bondues (59)
            </span>
          </Link>

          <form action="/" className="relative hidden flex-1 max-w-md sm:block" role="search">
            <label htmlFor="site-search" className="sr-only">
              Rechercher un produit
            </label>
            <input
              id="site-search"
              type="search"
              name="search"
              placeholder="Chercher un meuble, une référence…"
              className="w-full rounded-full border border-ligne bg-beton/60 py-2 pl-10 pr-4 text-sm text-encre placeholder:text-gris focus:border-bleu focus:bg-blanc"
            />
            <Search aria-hidden className="pointer-events-none absolute left-3.5 top-2.5 h-4 w-4 text-gris" />
          </form>

          <div className="flex items-center gap-2">
            <Link
              href={status === 'authenticated' ? '/account' : '/login'}
              className="flex items-center gap-2 rounded-full border border-ligne px-4 py-2 text-sm font-medium text-encre transition-colors hover:border-bleu hover:text-bleu"
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
              className="relative flex items-center gap-2 rounded-full border border-ligne px-4 py-2 text-sm font-medium text-encre transition-colors hover:border-bleu hover:text-bleu"
              aria-label={`Ouvrir le panier, ${count} article${count > 1 ? 's' : ''}`}
            >
              <ShoppingBag aria-hidden className="h-4 w-4" />
              <span className="hidden sm:inline">Panier</span>
              {count > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-orange px-1 font-mono text-[11px] font-semibold text-blanc">
                  {count}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="-mx-1 flex items-center justify-between gap-2 border-t border-ligne/60 py-1">
          <Suspense fallback={<div className="h-9" />}>
            <CategoryNav />
          </Suspense>
          <p className="hidden font-mono text-[11px] uppercase tracking-widest text-gris lg:block">
            Retrait gratuit à Bondues
          </p>
        </div>
      </div>

      <form action="/" className="border-t border-ligne/60 px-4 py-2 sm:hidden" role="search">
        <label htmlFor="site-search-mobile" className="sr-only">
          Rechercher un produit
        </label>
        <div className="relative">
          <input
            id="site-search-mobile"
            type="search"
            name="search"
            placeholder="Chercher un meuble, une référence…"
            className="w-full rounded-full border border-ligne bg-beton/60 py-2 pl-10 pr-4 text-sm"
          />
          <Search aria-hidden className="pointer-events-none absolute left-3.5 top-2.5 h-4 w-4 text-gris" />
        </div>
      </form>
    </header>
  )
}
