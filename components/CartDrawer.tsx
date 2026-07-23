'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react'
import { useCart } from '@/lib/cart'
import { useUI } from '@/lib/ui'
import { formatPrice } from '@/components/Sticker'
import { EASE } from '@/components/motion'

export default function CartDrawer() {
  const { items, removeItem, updateQuantity, total } = useCart()
  const { cartOpen, closeCart } = useUI()
  const reduce = useReducedMotion()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeCart()
    }
    if (cartOpen) {
      document.addEventListener('keydown', onKey)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [cartOpen, closeCart])

  return (
    <AnimatePresence>
      {cartOpen && (
        <>
          <motion.button
            aria-label="Fermer le panier"
            className="fixed inset-0 z-50 bg-encre/40 backdrop-blur-[2px]"
            onClick={closeCart}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label="Panier"
            className="fixed bottom-0 right-0 top-0 z-50 flex w-full max-w-md flex-col bg-blanc shadow-levee"
            initial={reduce ? { opacity: 0 } : { x: '100%' }}
            animate={reduce ? { opacity: 1 } : { x: 0 }}
            exit={reduce ? { opacity: 0 } : { x: '100%' }}
            transition={{ duration: 0.38, ease: EASE }}
          >
            <div className="flex items-center justify-between border-b border-ligne px-5 py-4">
              <h2 className="font-display text-lg font-bold text-encre">
                Votre panier
              </h2>
              <button
                onClick={closeCart}
                aria-label="Fermer"
                className="flex h-9 w-9 items-center justify-center rounded-full text-gris transition-colors hover:bg-beton hover:text-encre"
              >
                <X aria-hidden className="h-5 w-5" />
              </button>
            </div>

            {items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
                <ShoppingBag aria-hidden className="h-8 w-8 text-gris" />
                <p className="font-medium text-encre">Votre panier est vide.</p>
                <p className="text-sm text-gris">
                  Chaque pièce est en un seul exemplaire — si un article vous
                  plaît, ne tardez pas.
                </p>
                <button
                  onClick={closeCart}
                  className="mt-2 rounded-full bg-bleu px-6 py-2.5 text-sm font-semibold text-blanc transition-colors hover:bg-bleu-deep"
                >
                  Parcourir l’arrivage
                </button>
              </div>
            ) : (
              <>
                <ul className="flex-1 divide-y divide-ligne overflow-y-auto px-5">
                  {items.map((item) => (
                    <li key={item.productId} className="flex gap-3 py-4">
                      <img
                        src={item.photo || '/placeholder.png'}
                        alt=""
                        className="h-16 w-16 shrink-0 rounded-lg border border-ligne object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-sm font-medium leading-snug text-encre">
                          {item.name.replace(/^vidaXL\s+/i, '')}
                        </p>
                        <p className="mt-1 font-mono text-sm font-semibold text-encre">
                          {formatPrice(item.price)} €
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                            aria-label="Réduire la quantité"
                            className="flex h-7 w-7 items-center justify-center rounded-full border border-ligne text-gris hover:border-bleu hover:text-bleu"
                          >
                            <Minus aria-hidden className="h-3.5 w-3.5" />
                          </button>
                          <span className="w-6 text-center font-mono text-sm">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            aria-label="Augmenter la quantité"
                            className="flex h-7 w-7 items-center justify-center rounded-full border border-ligne text-gris hover:border-bleu hover:text-bleu"
                          >
                            <Plus aria-hidden className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                      <button
                        onClick={() => removeItem(item.productId)}
                        aria-label={`Retirer ${item.name} du panier`}
                        className="self-start p-1 text-gris transition-colors hover:text-orange-deep"
                      >
                        <Trash2 aria-hidden className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>

                <div className="border-t border-ligne p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="text-sm text-gris">Sous-total</span>
                    <span className="font-mono text-lg font-semibold text-encre">
                      {formatPrice(total())} €
                    </span>
                  </div>
                  <Link
                    href="/cart"
                    onClick={closeCart}
                    className="block w-full rounded-full bg-bleu py-3 text-center text-sm font-semibold text-blanc transition-colors hover:bg-bleu-deep"
                  >
                    Choisir ma livraison et payer
                  </Link>
                  <p className="mt-3 text-center font-mono text-[10px] uppercase tracking-widest text-gris">
                    Retrait gratuit à Bondues · Paiement Stripe
                  </p>
                </div>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
