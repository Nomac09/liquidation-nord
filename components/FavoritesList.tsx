'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Heart, ImageOff } from 'lucide-react'
import { formatPrice } from '@/components/Sticker'

export interface FavoriteProduct {
  _id: string
  name: string
  slug: string
  salePrice: number
  photos: string[]
  status: 'sellable' | 'sold' | 'unsellable'
}

export default function FavoritesList({ initial }: { initial: FavoriteProduct[] }) {
  const [items, setItems] = useState(initial)
  const [removingId, setRemovingId] = useState<string | null>(null)

  const remove = async (productId: string) => {
    setRemovingId(productId)
    const res = await fetch(`/api/favorites/${productId}`, { method: 'DELETE' })
    if (res.ok) {
      setItems((prev) => prev.filter((p) => p._id !== productId))
    }
    setRemovingId(null)
  }

  if (items.length === 0) {
    return (
      <p className="mt-4 text-sm text-gris">
        Aucun favori pour l’instant — le cœur sur une pièce l’ajoute ici.
      </p>
    )
  }

  return (
    <ul className="mt-3 divide-y divide-ligne">
      {items.map((p) => {
        const unavailable = p.status !== 'sellable'
        const photo = p.photos?.[0]
        return (
          <li key={p._id} className="flex items-center gap-4 py-3">
            <Link href={`/product/${p.slug}`} className="shrink-0">
              {photo ? (
                <img
                  src={photo}
                  alt=""
                  className={`h-16 w-16 rounded-lg border border-ligne object-cover ${unavailable ? 'grayscale opacity-60' : ''}`}
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-ligne bg-beton text-gris">
                  <ImageOff aria-hidden className="h-5 w-5" />
                </div>
              )}
            </Link>
            <div className="min-w-0 flex-1">
              <Link
                href={`/product/${p.slug}`}
                className={`line-clamp-2 text-sm font-medium leading-snug text-encre hover:underline ${unavailable ? 'text-gris' : ''}`}
              >
                {p.name}
              </Link>
              <p className="mt-1 flex items-center gap-2">
                <span className={`font-mono text-sm font-semibold text-encre ${unavailable ? 'line-through decoration-orange-deep' : ''}`}>
                  {formatPrice(p.salePrice)} €
                </span>
                {unavailable && (
                  <span className="font-mono text-[10px] uppercase tracking-widest text-orange-deep">
                    {p.status === 'sold' ? 'Vendu' : 'Indisponible'}
                  </span>
                )}
              </p>
            </div>
            <button
              type="button"
              onClick={() => remove(p._id)}
              disabled={removingId === p._id}
              aria-label={`Retirer ${p.name} des favoris`}
              className="shrink-0 rounded-full border border-ligne p-2 text-bleu transition-colors hover:border-orange-deep hover:text-orange-deep disabled:opacity-50"
            >
              <Heart aria-hidden className="h-4 w-4" fill="currentColor" />
            </button>
          </li>
        )
      })}
    </ul>
  )
}
