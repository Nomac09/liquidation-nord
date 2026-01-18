// app/cart/page.tsx
'use client'

import { useCart } from '@/lib/cart'
import Image from 'next/image'
import Link from 'next/link'
import { Trash2, Plus, Minus } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function CartPage() {
  const { items, removeItem, updateQuantity, total } = useCart()
  const [shippingMethod, setShippingMethod] = useState<'pickup' | 'relay' | 'home'>('pickup')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const shippingCosts = {
    pickup: 0,
    relay: 29.99,
    home: 79.99
  }

  const handleCheckout = async () => {
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/checkout/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(item => ({
            productId: item.productId,
            name: item.name,
            price: item.price,
            quantity: item.quantity
          })),
          shippingMethod,
          shippingCost: shippingCosts[shippingMethod],
          subtotal: total()
        })
      })

      const { url } = await response.json()
      router.push(url)
    } catch (error) {
      console.error('Checkout error:', error)
      alert('Erreur lors du paiement')
    } finally {
      setIsLoading(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-beige py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl font-bold text-anthracite mb-4">
            Votre panier est vide
          </h1>
          <Link 
            href="/"
            className="bg-oak text-white px-6 py-3 rounded-lg hover:bg-anthracite transition-colors"
          >
            Continuer mes achats
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-beige py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-anthracite mb-8">
          Mon panier ({items.length} articles)
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div key={item.productId} className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex gap-4">
                  <div className="relative w-24 h-24 flex-shrink-0">
                    <Image
                      src={item.photo || '/placeholder.png'}
                      alt={item.name}
                      fill
                      className="object-cover rounded-lg"
                    />
                  </div>
                  
                  <div className="flex-grow">
                    <h3 className="font-semibold text-anthracite mb-2">{item.name}</h3>
                    <p className="text-oak font-bold text-lg">{item.price}€</p>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <button
                      onClick={() => removeItem(item.productId)}
                      className="text-warm-gray hover:text-red-500"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        className="p-1 rounded-full bg-beige hover:bg-warm-gray"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="font-semibold w-8 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        className="p-1 rounded-full bg-beige hover:bg-warm-gray"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-xl font-semibold mb-4">Résumé de la commande</h2>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span>Sous-total</span>
                  <span>{total().toFixed(2)}€</span>
                </div>
                
                <div className="border-t pt-3">
                  <h3 className="font-semibold mb-3">Mode de livraison</h3>
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="shipping"
                        value="pickup"
                        checked={shippingMethod === 'pickup'}
                        onChange={(e) => setShippingMethod(e.target.value as any)}
                        className="text-oak"
                      />
                      <div>
                        <p className="font-medium">Retrait gratuit</p>
                        <p className="text-sm text-warm-gray">À Bondues (59910)</p>
                      </div>
                      <span className="ml-auto font-semibold">0€</span>
                    </label>
                    
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="shipping"
                        value="relay"
                        checked={shippingMethod === 'relay'}
                        onChange={(e) => setShippingMethod(e.target.value as any)}
                        className="text-oak"
                      />
                      <div>
                        <p className="font-medium">Point relais</p>
                        <p className="text-sm text-warm-gray">Mondial Relay (130kg max)</p>
                      </div>
                      <span className="ml-auto font-semibold">29.99€</span>
                    </label>
                    
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="shipping"
                        value="home"
                        checked={shippingMethod === 'home'}
                        onChange={(e) => setShippingMethod(e.target.value as any)}
                        className="text-oak"
                      />
                      <div>
                        <p className="font-medium">Livraison à domicile</p>
                        <p className="text-sm text-warm-gray">Cocolis (pas de limite)</p>
                      </div>
                      <span className="ml-auto font-semibold">79.99€</span>
                    </label>
                  </div>
                </div>
                
                <div className="border-t pt-3">
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span>{(total() + shippingCosts[shippingMethod]).toFixed(2)}€</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                disabled={isLoading}
                className="w-full bg-oak text-white py-3 rounded-lg font-semibold hover:bg-anthracite transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Chargement...' : 'Procéder au paiement'}
              </button>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm text-center">
              <p className="text-sm text-warm-gray">
                Paiement sécurisé par Stripe • TVA non applicable, art. 293B du CGI
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}