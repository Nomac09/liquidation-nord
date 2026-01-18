'use client'

import { useCart } from '@/lib/cart'
import { ShoppingCart } from 'lucide-react'
import { useState } from 'react'

export default function CartDrawer() {
  const { items, removeItem, total } = useCart()
  const [isOpen, setIsOpen] = useState(false)

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <>
      {/* Cart Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-oak text-white p-4 rounded-full shadow-lg hover:bg-anthracite transition-colors z-40"
      >
        <div className="relative">
          <ShoppingCart className="h-6 w-6" />
          {itemCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {itemCount}
            </span>
          )}
        </div>
      </button>
    </>
  )
}
