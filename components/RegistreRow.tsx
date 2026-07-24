'use client'

import Link from 'next/link'
import { ImageOff, Plus } from 'lucide-react'
import { useCart } from '@/lib/cart'
import { useUI } from '@/lib/ui'
import { formatPrice } from '@/components/Sticker'
import type { CatalogProduct } from '@/components/ProductCard'

// The dense scanning view: one line per piece, tabular-nums prices,
// minimal chrome. For working through a large arrivage quickly rather
// than browsing photo by photo.
export default function RegistreRow({ product }: { product: CatalogProduct }) {
  const { addItem } = useCart()
  const { openCart } = useUI()
  const photo = product.photos?.[0]

  const handleAdd = () => {
    addItem({
      productId: product._id,
      name: product.name,
      price: product.salePrice,
      photo: photo || '/placeholder.png',
    })
    openCart()
  }

  return (
    <div className="flex items-center gap-3 border-b border-ligne py-2 last:border-b-0">
      <Link href={`/product/${product.slug}`} className="flex min-w-0 flex-1 items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded border border-ligne bg-beton">
          {photo ? (
            <img src={photo} alt="" loading="lazy" className="h-full w-full object-cover" />
          ) : (
            <ImageOff aria-hidden className="h-3.5 w-3.5 text-gris" />
          )}
        </div>
        <span className="min-w-0 flex-1 truncate text-sm text-encre">{product.name}</span>
        <span className="hidden shrink-0 font-mono text-[10px] uppercase tracking-widest text-gris sm:inline">
          {product.internalRef || ''}
        </span>
      </Link>
      <span className="shrink-0 font-mono text-sm font-semibold tabular-nums text-encre">
        {formatPrice(product.salePrice)} €
      </span>
      <button
        onClick={handleAdd}
        aria-label={`Ajouter ${product.name} au panier`}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-ligne text-encre transition-colors hover:border-bleu hover:bg-bleu hover:text-blanc"
      >
        <Plus aria-hidden className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
