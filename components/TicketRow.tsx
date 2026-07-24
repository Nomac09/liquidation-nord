'use client'

import Link from 'next/link'
import { ImageOff, Plus } from 'lucide-react'
import { useCart } from '@/lib/cart'
import { useUI } from '@/lib/ui'
import Sticker from '@/components/Sticker'
import type { CatalogProduct } from '@/components/ProductCard'

const CATEGORY_LABELS: Record<string, string> = {
  Mobilier: 'Mobilier',
  Bazar: 'Bazar & Déco',
  Bricolage: 'Bricolage',
  Textile: 'Textile',
}

// A wide ticket row, not a square card: photo | perforated tear | info |
// perforated tear | price + claim. Full-bleed at every width — mobile
// stays a single narrow column of these rows rather than stacking the
// photo above the text like a generic product card.
export default function TicketRow({ product }: { product: CatalogProduct }) {
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
    <article className="group grid grid-cols-[92px_1fr_auto] border border-ligne bg-blanc transition-colors hover:border-encre/40 sm:grid-cols-[150px_1fr_150px]">
      <Link href={`/product/${product.slug}`} className="contents">
        <div className="relative flex items-center justify-center overflow-hidden bg-beton p-2 sm:p-3">
          {photo ? (
            <img
              src={photo}
              alt={product.name}
              loading="lazy"
              className="max-h-24 max-w-full object-contain transition-transform duration-500 ease-out group-hover:scale-[1.03] sm:max-h-32"
            />
          ) : (
            <ImageOff aria-hidden className="h-5 w-5 text-gris" />
          )}
        </div>

        <div className="perforated relative flex min-w-0 flex-col justify-center gap-1 px-4 py-3 sm:px-5">
          <p className="truncate font-mono text-[10px] uppercase tracking-widest text-gris">
            Réf. {product.internalRef || '—'} · {CATEGORY_LABELS[product.category] || product.category}
          </p>
          <h3 className="line-clamp-2 text-[14px] font-medium leading-snug text-encre sm:text-[15px]">
            {product.name}
          </h3>
        </div>
      </Link>

      <div className="perforated relative flex flex-col items-center justify-center gap-2 px-2.5 py-3 sm:px-4">
        <Sticker price={product.salePrice} rrp={product.rrp} />
        <button
          onClick={handleAdd}
          aria-label={`Ajouter ${product.name} au panier`}
          className="flex items-center gap-1 rounded-full border border-ligne px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-encre transition-colors hover:border-bleu hover:bg-bleu hover:text-blanc"
        >
          <Plus aria-hidden className="h-3 w-3" />
          Ajouter
        </button>
      </div>
    </article>
  )
}
