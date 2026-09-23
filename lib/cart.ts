import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { trackEvent } from '@/lib/analytics'

interface CartItem {
  productId: string
  name: string
  price: number
  quantity: number
  photo: string
  weight: number
}

interface CartState {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'quantity'>) => void
  removeItem: (productId: string) => void
  clearCart: () => void
  total: () => number
  totalWeight: () => number
}

// Every product is a single physical unit — there is never more than one
// of anything to buy, so quantity is always 1. addItem is idempotent: if
// the item is already in the cart, this does nothing.
export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => {
        const items = get().items
        if (items.some((i) => i.productId === item.productId)) return
        set({ items: [...items, { ...item, quantity: 1 }] })
        // Fired here rather than in the buttons, because there are two
        // call sites (the product page and the grid row) and a third
        // would silently go unmeasured.
        trackEvent('add_to_cart', {
          currency: 'EUR',
          value: item.price,
          item_id: item.productId,
          item_name: item.name,
        })
      },
      removeItem: (productId) => {
        set({ items: get().items.filter(i => i.productId !== productId) })
      },
      clearCart: () => set({ items: [] }),
      total: () => {
        return get().items.reduce((sum, item) => sum + item.price, 0)
      },
      // Falls back to 0 per item — carts persisted before `weight` was
      // added to CartItem won't have it until re-added.
      totalWeight: () => {
        return get().items.reduce((sum, item) => sum + (item.weight || 0), 0)
      }
    }),
    {
      name: 'cart-storage',
    }
  )
)
