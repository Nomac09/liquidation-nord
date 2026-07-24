'use client'

import Link from 'next/link'
import { useCart } from '@/lib/cart'
import { useUI } from '@/lib/ui'
import Sticker from '@/components/Sticker'
import { ImageOff, Plus } from 'lucide-react'

export interface CatalogProduct {
  _id: string
  name: string
  ean: string
  category: string
  rrp: number
  salePrice: number
  photos: string[]
  condition?: string
  slug: string
}

export default function ProductCard({ product }: { product: CatalogProduct }) {
  const { addItem } = useCart()
  const { openCart } = useUI()
  const photo = product.photos?.[0]

  const handleAdd = () => {
    addItem({
      productId: product._id,
      name: product.name,
      price: product.salePrice,
      quantity: 1,
      photo: photo || '/placeholder.png',
    })
    openCart()
  }

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-ligne bg-blanc shadow-carte transition-all duration-300 hover:-translate-y-1 hover:shadow-levee">
      <Link
        href={`/product/${product.slug}`}
        className="flex flex-col focus-visible:outline-offset-[-2px]"
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-beton">
          {photo ? (
            <img
              src={photo}
              alt={product.name}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-gris">
              <ImageOff aria-hidden className="h-7 w-7" />
              <span className="font-mono text-[11px] uppercase tracking-widest">
                Photo à venir
              </span>
            </div>
          )}
          <span className="absolute left-3 top-3 rounded-full bg-blanc/90 px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-encre backdrop-blur-sm">
            {product.category === 'Bazar' ? 'Bazar & Déco' : product.category}
          </span>
        </div>

        <h3 className="line-clamp-2 min-h-[2.6em] px-4 pt-4 text-[15px] font-medium leading-snug text-encre">
          {product.name}
        </h3>
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-4 pt-3">
        <div className="mt-auto flex items-end justify-between gap-2">
          <Sticker price={product.salePrice} rrp={product.rrp} />
          <button
            onClick={handleAdd}
            aria-label={`Ajouter ${product.name} au panier`}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-ligne text-encre transition-colors hover:border-bleu hover:bg-bleu hover:text-blanc"
          >
            <Plus aria-hidden className="h-4 w-4" />
          </button>
        </div>

        <p className="font-mono text-[10px] uppercase tracking-widest text-gris">
          Pièce unique · EAN {product.ean}
        </p>
      </div>
    </article>
  )
}
