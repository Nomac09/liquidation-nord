'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, ShoppingBag } from 'lucide-react'
import { useCart } from '@/lib/cart'

// Takes only the exact fields needed — never the whole product object.
// Server Components serialize an entire prop into the page payload when
// it's passed to a Client Component, even fields this component never
// reads, so anything sensitive (the raw EAN) must not be passed in.
export default function AddToCart({
  productId,
  name,
  price,
  photo,
  weight,
}: {
  productId: string
  name: string
  price: number
  photo?: string
  weight?: number
}) {
  const { addItem } = useCart()
  const [added, setAdded] = useState(false)

  const handleAdd = () => {
    addItem({
      productId,
      name,
      price,
      photo: photo || '/placeholder.png',
      weight: weight || 0,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 1200)
  }

  return (
    <button
      onClick={handleAdd}
      disabled={added}
      className={`relative flex w-full items-center justify-center gap-2 overflow-hidden py-4 font-karla text-sm font-semibold tracking-wide transition-colors ${
        added ? 'bg-verdigris-deep text-stone' : 'bg-verdigris text-stone hover:bg-verdigris-deep'
      }`}
    >
      <AnimatePresence mode="wait" initial={false}>
        {added ? (
          <motion.span
            key="ok"
            className="flex items-center gap-2"
            initial={{ y: 14, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -14, opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            <Check aria-hidden className="h-4 w-4" />
            C’est dans le panier
          </motion.span>
        ) : (
          <motion.span
            key="add"
            className="flex items-center gap-2"
            initial={{ y: 14, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -14, opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            <ShoppingBag aria-hidden className="h-4 w-4" />
            Ajouter au panier
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  )
}
