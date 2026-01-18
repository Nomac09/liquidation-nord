// app/success/page.tsx
'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'

interface OrderDetails {
  orderId: string
  items: any[]
  total: number
  shippingMethod: string
  customerEmail: string
}

function SuccessContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const [order, setOrder] = useState<OrderDetails | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (sessionId) {
      fetch(`/api/orders/by-session?session_id=${sessionId}`)
        .then(res => res.json())
        .then(data => {
          setOrder(data)
          setLoading(false)
        })
        .catch(err => {
          console.error('Error fetching order:', err)
          setLoading(false)
        })
    }
  }, [sessionId])

  if (loading) {
    return (
      <div className="min-h-screen bg-beige flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-oak mx-auto mb-4"></div>
          <p>Chargement de votre commande...</p>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-beige flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Commande introuvable
          </h1>
          <Link href="/" className="text-oak hover:underline">
            Retour à l'accueil
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-beige py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h1 className="text-3xl font-bold text-anthracite mb-4">
            Commande confirmée !
          </h1>
          
          <p className="text-lg text-warm-gray mb-6">
            Merci pour votre achat. Un email de confirmation a été envoyé à {order.customerEmail}
          </p>

          <div className="bg-beige p-6 rounded-lg mb-6 text-left">
            <h2 className="font-semibold text-anthracite mb-4">
              Détails de la commande #{order.orderId}
            </h2>
            
            <div className="space-y-2 mb-4">
              {order.items.map((item, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span>{item.name} x{item.quantity}</span>
                  <span>{(item.price * item.quantity).toFixed(2)}€</span>
                </div>
              ))}
            </div>
            
            <div className="border-t pt-2">
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>{order.total.toFixed(2)}€</span>
              </div>
            </div>
          </div>

          <div className="bg-oak text-white p-4 rounded-lg mb-6">
            <h3 className="font-semibold mb-2">
              {order.shippingMethod === 'pickup' 
                ? 'Retrait disponible' 
                : 'Livraison prévue'
              }
            </h3>
            <p className="text-sm">
              {order.shippingMethod === 'pickup' 
                ? 'Votre commande est prête au retrait à Bondues (59910). Horaires: Lun-Sam 9h-18h.'
                : 'Vous recevrez un email avec le numéro de suivi dès l\'expédition.'
              }
            </p>
          </div>

          <div className="space-y-3">
            <Link
              href="/"
              className="block w-full bg-anthracite text-white py-3 rounded-lg font-semibold hover:bg-oak transition-colors"
            >
              Continuer mes achats
            </Link>
            
            <p className="text-sm text-warm-gray">
              Des questions ? Contactez-nous: contact@liquidationnord.fr
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-beige flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-oak mx-auto mb-4"></div>
          <p>Chargement...</p>
        </div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
}