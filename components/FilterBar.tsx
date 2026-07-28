'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { formatPrice } from '@/components/Sticker'

interface Suggestion {
  _id: string
  name: string
  slug: string
  salePrice: number
  photos: string[]
}

const COLORS = ['Noir', 'Anthracite', 'Blanc', 'Gris', 'Marron', 'Beige', 'Crème', 'Vert', 'Taupe']
const MATERIALS = ['Acier', 'Polyester', 'Bois', 'Pin', 'Acacia', 'Fer', 'Aluminium', 'Polypropylène', 'Bambou', 'Velours', 'Teck']

function FilterBarInner() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [panelOpen, setPanelOpen] = useState(false)
  const boxRef = useRef<HTMLDivElement>(null)

  const priceMin = searchParams.get('priceMin') || ''
  const priceMax = searchParams.get('priceMax') || ''
  const material = searchParams.get('material') || ''
  const color = searchParams.get('color') || ''
  const activeFilterCount = [priceMin, priceMax, material, color].filter(Boolean).length

  useEffect(() => {
    if (query.trim().length < 2) {
      setSuggestions([])
      return
    }
    const handle = setTimeout(async () => {
      const res = await fetch(`/api/products?search=${encodeURIComponent(query)}&limit=6`)
      if (!res.ok) return
      const data = await res.json()
      setSuggestions(data.items || [])
    }, 220)
    return () => clearTimeout(handle)
  }, [query])

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const submitSearch = () => {
    if (!query.trim()) return
    router.push(`/?search=${encodeURIComponent(query.trim())}`)
    setShowSuggestions(false)
  }

  const applyFilter = (key: string, value: string) => {
    const params = new URLSearchParams(pathname === '/' ? searchParams.toString() : '')
    if (value) params.set(key, value)
    else params.delete(key)
    router.push(`/?${params.toString()}`)
  }

  const clearFilters = () => {
    const params = new URLSearchParams(pathname === '/' ? searchParams.toString() : '')
    params.delete('priceMin')
    params.delete('priceMax')
    params.delete('material')
    params.delete('color')
    router.push(`/?${params.toString()}`)
    setPanelOpen(false)
  }

  return (
    <div className="border-b border-hairline bg-surface">
      <div className="container mx-auto flex flex-wrap items-center gap-2 px-4 py-2">
        <div ref={boxRef} className="relative min-w-[200px] flex-1">
          <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-dust" />
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setShowSuggestions(true)
            }}
            onFocus={() => setShowSuggestions(true)}
            onKeyDown={(e) => e.key === 'Enter' && submitSearch()}
            placeholder="Chercher une pièce…"
            className="w-full rounded-full border border-hairline bg-stone/50 py-1.5 pl-8 pr-3 font-mono text-[11px] text-ink placeholder:text-dust focus:border-verdigris focus:bg-surface"
          />

          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full z-30 mt-1.5 max-h-80 overflow-y-auto rounded-lg border border-hairline bg-surface shadow-levee">
              {suggestions.map((s) => (
                <Link
                  key={s._id}
                  href={`/product/${s.slug}`}
                  onClick={() => setShowSuggestions(false)}
                  className="flex items-center gap-3 border-b border-hairline px-3 py-2 last:border-b-0 hover:bg-stone"
                >
                  <img src={s.photos?.[0] || '/placeholder.png'} alt="" className="h-9 w-9 shrink-0 rounded border border-hairline object-cover" />
                  <span className="min-w-0 flex-1 truncate text-sm text-ink">{s.name}</span>
                  <span className="shrink-0 font-mono text-xs font-semibold text-ink">{formatPrice(s.salePrice)} €</span>
                </Link>
              ))}
              <button
                onClick={submitSearch}
                className="block w-full px-3 py-2 text-center font-mono text-[10px] uppercase tracking-widest text-verdigris-deep hover:bg-stone"
              >
                Voir tous les résultats
              </button>
            </div>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => setPanelOpen((v) => !v)}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest transition-colors ${
              activeFilterCount > 0 ? 'border-verdigris bg-verdigris/10 text-verdigris-deep' : 'border-hairline text-ink hover:bg-stone'
            }`}
          >
            <SlidersHorizontal aria-hidden className="h-3 w-3" />
            Filtres
            {activeFilterCount > 0 && <span>({activeFilterCount})</span>}
          </button>

          {panelOpen && (
            <div className="absolute right-0 top-full z-30 mt-1.5 w-72 rounded-lg border border-hairline bg-surface p-4 shadow-levee">
              <div className="flex items-center justify-between">
                <p className="tag-label">Filtres</p>
                <button onClick={() => setPanelOpen(false)} aria-label="Fermer">
                  <X aria-hidden className="h-3.5 w-3.5 text-dust" />
                </button>
              </div>

              <div className="mt-3">
                <p className="mb-1.5 font-mono text-[10px] uppercase tracking-widest text-dust">Prix (€)</p>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    placeholder="Min"
                    defaultValue={priceMin}
                    onBlur={(e) => applyFilter('priceMin', e.target.value)}
                    className="w-full rounded-lg border border-hairline px-2.5 py-1.5 text-sm focus:border-verdigris"
                  />
                  <span className="text-dust">–</span>
                  <input
                    type="number"
                    min={0}
                    placeholder="Max"
                    defaultValue={priceMax}
                    onBlur={(e) => applyFilter('priceMax', e.target.value)}
                    className="w-full rounded-lg border border-hairline px-2.5 py-1.5 text-sm focus:border-verdigris"
                  />
                </div>
              </div>

              <div className="mt-3">
                <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-dust" htmlFor="filter-material">Matière</label>
                <select
                  id="filter-material"
                  value={material}
                  onChange={(e) => applyFilter('material', e.target.value)}
                  className="w-full rounded-lg border border-hairline px-2.5 py-1.5 text-sm text-ink focus:border-verdigris"
                >
                  <option value="">Toutes</option>
                  {MATERIALS.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              <div className="mt-3">
                <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-dust" htmlFor="filter-color">Couleur</label>
                <select
                  id="filter-color"
                  value={color}
                  onChange={(e) => applyFilter('color', e.target.value)}
                  className="w-full rounded-lg border border-hairline px-2.5 py-1.5 text-sm text-ink focus:border-verdigris"
                >
                  <option value="">Toutes</option>
                  {COLORS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="mt-4 w-full rounded-full border border-hairline py-1.5 font-mono text-[10px] uppercase tracking-widest text-dust hover:border-hairline-strong hover:text-ink"
                >
                  Réinitialiser
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function FilterBar() {
  return (
    <Suspense fallback={<div className="h-[49px] border-b border-hairline bg-surface" />}>
      <FilterBarInner />
    </Suspense>
  )
}
