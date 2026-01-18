// components/AddToCart.tsx
'use client'

import { useCart } from '@/lib/cart'
import { useState } from 'react'

interface AddToCartProps {
  product: any
}

export default function AddToCart({ product }: AddToCartProps) {
  const { addItem } = useCart()
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)

  const handleAddToCart = () => {
    addItem({
      productId: product._id,
      name: product.name,
      price: product.salePrice,
      quantity,
      photo: product.photos[0] || '/placeholder.png'
    })
    
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <div className="flex gap-3">
      <div className="flex items-center border rounded-lg">
        <button
          onClick={() => setQuantity(Math.max(1, quantity - 1))}
          className="px-3 py-2 hover:bg-beige"
        >
          -
        </button>
        <span className="px-4 py-2 font-semibold">{quantity}</span>
        <button
          onClick={() => setQuantity(quantity + 1)}
          className="px-3 py-2 hover:bg-beige"
        >
          +
        </button>
      </div>
      
      <button
        onClick={handleAddToCart}
        className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-colors ${
          added 
            ? 'bg-green-500 text-white' 
            : 'bg-oak text-white hover:bg-anthracite'
        }`}
      >
        {added ? '✓ Ajouté !' : 'Ajouter au panier'}
      </button>
    </div>
  )
}