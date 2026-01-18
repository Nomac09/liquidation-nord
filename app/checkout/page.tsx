
'use client'

import { useCart } from '@/lib/cart'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function CheckoutPage() {
  const { items, total, clearCart } = useCart()
  const [isLoading, setIsLoading] = useState(false)
  const [shippingMethod, setShippingMethod] = useState<'pickup' | 'relay' | 'home'>('pickup')
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

      const data = await response.json()
      
      if (data.url) {
        clearCart()
        router.push(data.url)
      } else {
        alert('Erreur lors de la création de la session de paiement')
      }
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
          <p className="text-lg text-warm-gray mb-8">
            Ajoutez des produits à votre panier avant de passer commande
          </p>
          <button
            onClick={() => router.push('/')}
            className="bg-oak text-white px-6 py-3 rounded-lg hover:bg-anthracite transition-colors"
          >
            Continuer mes achats
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-beige py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <h1 className="text-3xl font-bold text-anthracite mb-8">
          Finaliser la commande
        </h1>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Résumé de la commande</h2>
          
          <div className="space-y-3 mb-6">
            {items.map((item) => (
              <div key={item.productId} className="flex justify-between py-2 border-b">
                <span>{item.name} x {item.quantity}</span>
                <span>{(item.price * item.quantity).toFixed(2)}€</span>
              </div>
            ))}
            
            <div className="flex justify-between font-semibold pt-2">
              <span>Sous-total</span>
              <span>{total().toFixed(2)}€</span>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="font-semibold mb-3">Mode de livraison</h3>
            <div className="space-y-3">
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

          <div className="border-t pt-4">
            <div className="flex justify-between font-semibold text-lg mb-4">
              <span>Total</span>
              <span>{(total() + shippingCosts[shippingMethod]).toFixed(2)}€</span>
            </div>

            <button
              onClick={handleCheckout}
              disabled={isLoading}
              className="w-full bg-oak text-white py-3 rounded-lg font-semibold hover:bg-anthracite transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Chargement...' : 'Procéder au paiement'}
            </button>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm text-center">
          <p className="text-sm text-warm-gray">
            Paiement sécurisé par Stripe • TVA non applicable, art. 293B du CGI
          </p>
        </div>
      </div>
    </div>
  )
}