'use client'

import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Heart } from 'lucide-react'
import { useFavorites } from '@/lib/favorites'

export default function FavoriteButton({
  productId,
  productName,
  size = 'md',
  className = '',
}: {
  productId: string
  productName: string
  size?: 'sm' | 'md'
  className?: string
}) {
  const router = useRouter()
  const { status } = useSession()
  const isFavorite = useFavorites((s) => s.isFavorite(productId))
  const toggle = useFavorites((s) => s.toggle)

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (status !== 'authenticated') {
      // Read from window rather than useSearchParams so this component
      // never forces a Suspense boundary on whatever page renders it —
      // it's only needed inside this click handler, not during render.
      const here = window.location.pathname + window.location.search
      router.push(`/login?callbackUrl=${encodeURIComponent(here)}`)
      return
    }
    toggle(productId)
  }

  const dim = size === 'sm' ? 'h-7 w-7' : 'h-9 w-9'
  const iconDim = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={isFavorite ? `Retirer ${productName} des favoris` : `Ajouter ${productName} aux favoris`}
      aria-pressed={isFavorite}
      className={`flex shrink-0 items-center justify-center rounded-full border transition-colors ${dim} ${
        isFavorite
          ? 'border-bleu bg-bleu text-blanc'
          : 'border-ligne bg-blanc/90 text-encre hover:border-bleu hover:text-bleu'
      } ${className}`}
    >
      <Heart aria-hidden className={iconDim} fill={isFavorite ? 'currentColor' : 'none'} />
    </button>
  )
}
