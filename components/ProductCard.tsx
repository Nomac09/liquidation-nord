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

  // Debug: log if product has photos
  console.log('Product:', product.name, 'Photos:', product.photos?.length || 0)

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <Link href={`/product/${product.slug}`}>
        <div className="relative aspect-[4/3] bg-gray-100">
          {product.photos?.[0] ? (
            <>
              <img
                src={product.photos[0]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              {product.photos.length > 1 && (
                <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                  +{product.photos.length - 1}
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center text-gray-400">
                <div className="text-4xl mb-2">📷</div>
                <p className="text-sm">Pas d'image</p>
              </div>
            </div>
          )}
        </div>
      </Link>
      
      <div className="p-4">
        <Link href={`/product/${product.slug}`}>
          <h3 className="font-semibold text-anthracite mb-2 line-clamp-2 hover:text-oak transition-colors">
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
          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
            -{Math.round((1 - product.salePrice/product.rrp) * 100)}%
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
