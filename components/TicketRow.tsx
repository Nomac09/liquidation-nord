'use client'

import { useRef, useState, type ElementType } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, ImageOff, Plus } from 'lucide-react'
import { useCart } from '@/lib/cart'
import { useUI } from '@/lib/ui'
import Sticker from '@/components/Sticker'
import { CATEGORY_LABELS } from '@/lib/categories'
import type { CatalogProduct } from '@/components/ProductCard'

const SWIPE_THRESHOLD = 30

// A sold ticket is a closed ledger entry, not a link to click through —
// its product page is no longer live, so it renders as a plain grid
// participant instead of an anchor.
function PhotoInfoWrapper({
  sold,
  slug,
  children,
}: {
  sold: boolean
  slug: string
  children: React.ReactNode
}) {
  const Tag: ElementType = sold ? 'div' : Link
  const extraProps = sold ? {} : { href: `/product/${slug}` }
  return (
    <Tag className="contents" {...extraProps}>
      {children}
    </Tag>
  )
}

// A wide ticket row, not a square card: photo | perforated tear | info |
// perforated tear | price + claim. Full-bleed at every width — mobile
// stays a single narrow column of these rows rather than stacking the
// photo above the text like a generic product card.
export default function TicketRow({ product }: { product: CatalogProduct }) {
  const { addItem } = useCart()
  const { openCart } = useUI()
  const photos = (product.photos || []).filter(Boolean)
  const [index, setIndex] = useState(0)
  const touchStartX = useRef(0)
  const swiped = useRef(false)
  const sold = product.status === 'sold'

  const hasMultiple = photos.length > 1
  const photo = photos[index] || photos[0]

  const go = (delta: number) => {
    setIndex((i) => (i + delta + photos.length) % photos.length)
  }

  const handleAdd = () => {
    addItem({
      productId: product._id,
      name: product.name,
      price: product.salePrice,
      photo: photo || '/placeholder.png',
    })
    openCart()
  }

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    swiped.current = false
  }

  const onTouchMove = (e: React.TouchEvent) => {
    if (!hasMultiple) return
    const delta = e.touches[0].clientX - touchStartX.current
    if (Math.abs(delta) > SWIPE_THRESHOLD) {
      swiped.current = true
    }
  }

  const onTouchEnd = (e: React.TouchEvent) => {
    if (!hasMultiple || !swiped.current) return
    const delta = e.changedTouches[0].clientX - touchStartX.current
    if (delta < 0) go(1)
    else go(-1)
  }

  const onPhotoClick = (e: React.MouseEvent) => {
    // A swipe on touch devices fires a trailing click — swallow it so it
    // doesn't also navigate to the product page.
    if (swiped.current) {
      e.preventDefault()
      swiped.current = false
    }
  }

  return (
    <article
      className={`group grid grid-cols-[92px_1fr_auto] border border-ligne bg-blanc transition-colors sm:grid-cols-[150px_1fr_150px] ${
        sold ? 'opacity-60' : 'hover:border-encre/40'
      }`}
    >
      <PhotoInfoWrapper sold={sold} slug={product.slug}>
        <div
          className="relative flex items-center justify-center overflow-hidden bg-beton p-2 sm:p-3"
          onClick={onPhotoClick}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {photo ? (
            <img
              src={photo}
              alt={product.name}
              loading="lazy"
              className={`max-h-24 max-w-full object-contain transition-transform duration-500 ease-out sm:max-h-32 ${
                sold ? 'grayscale' : 'group-hover:scale-[1.03]'
              }`}
            />
          ) : (
            <ImageOff aria-hidden className="h-5 w-5 text-gris" />
          )}

          {hasMultiple && !sold && (
            <>
              <button
                type="button"
                aria-label="Photo précédente"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  go(-1)
                }}
                className="absolute left-0.5 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full bg-blanc/80 text-encre opacity-0 shadow-carte transition-opacity group-hover:opacity-100 sm:h-6 sm:w-6"
              >
                <ChevronLeft aria-hidden className="h-3 w-3" />
              </button>
              <button
                type="button"
                aria-label="Photo suivante"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  go(1)
                }}
                className="absolute right-0.5 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full bg-blanc/80 text-encre opacity-0 shadow-carte transition-opacity group-hover:opacity-100 sm:h-6 sm:w-6"
              >
                <ChevronRight aria-hidden className="h-3 w-3" />
              </button>
              <div className="absolute bottom-1 left-1/2 flex -translate-x-1/2 gap-1">
                {photos.map((_, i) => (
                  <span
                    key={i}
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setIndex(i)
                    }}
                    className={`h-1 w-1 rounded-full transition-colors ${
                      i === index ? 'bg-encre' : 'bg-encre/25'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        <div className="perforated relative flex min-w-0 flex-col justify-center gap-1 px-4 py-3 sm:px-5">
          <p className="truncate font-mono text-[10px] uppercase tracking-widest text-gris">
            Réf. {product.internalRef || '—'} · {CATEGORY_LABELS[product.category] || product.category}
          </p>
          <h3
            className={`line-clamp-2 text-[14px] font-medium leading-snug text-encre sm:text-[15px] ${
              sold ? 'line-through decoration-orange-deep' : ''
            }`}
          >
            {product.name}
          </h3>
          {product.specLine && (
            <p className="truncate font-mono text-[10px] text-gris">{product.specLine}</p>
          )}
        </div>
      </PhotoInfoWrapper>

      <div className="perforated relative flex flex-col items-center justify-center gap-2 px-2.5 py-3 sm:px-4">
        <span className={sold ? 'line-through decoration-orange-deep' : ''}>
          <Sticker price={product.salePrice} rrp={product.rrp} />
        </span>
        {sold ? (
          <span className="rounded-full border border-orange-deep px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-orange-deep">
            Vendu
          </span>
        ) : (
          <button
            onClick={handleAdd}
            aria-label={`Ajouter ${product.name} au panier`}
            className="flex items-center gap-1 rounded-full border border-ligne px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-encre transition-colors hover:border-bleu hover:bg-bleu hover:text-blanc"
          >
            <Plus aria-hidden className="h-3 w-3" />
            Ajouter
          </button>
        )}
      </div>
    </article>
  )
}
