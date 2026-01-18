'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useCart } from '@/lib/cart'

interface ProductCardProps {
  product: any
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart()

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    addItem({
      productId: product._id,
      name: product.name,
      price: product.salePrice,
      quantity: 1,
      photo: product.photos?.[0] || '/placeholder.png'
    })
  }

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <Link href={`/product/${product.slug}`}>
        <div className="relative aspect-[4/3]">
          <Image
            src={product.photos?.[0] || '/placeholder.png'}
            alt={product.name}
            fill
            className="object-cover"
          />
        </div>
      </Link>
      
      <div className="p-4">
        <Link href={`/product/${product.slug}`}>
          <h3 className="font-semibold text-anthracite mb-2 line-clamp-2">
            {product.name}
          </h3>
        </Link>
        
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl font-bold text-oak">
            {product.salePrice}€
          </span>
          <span className="text-sm text-warm-gray line-through">
            {product.rrp}€
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-warm-gray bg-beige px-2 py-1 rounded">
            {product.category}
          </span>
          <button
            onClick={handleAddToCart}
            className="bg-oak text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-anthracite transition-colors"
          >
            Ajouter
          </button>
        </div>
      </div>
    </div>
  )
}
