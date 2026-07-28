'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ArrowRight, CheckCircle2, Loader2 } from 'lucide-react'
import { useCart } from '@/lib/cart'
import { formatPrice } from '@/components/Sticker'

interface OrderDetails {
  orderId: string
  items: { name: string; quantity: number; price: number }[]
  total: number
  shippingMethod: string
  customerEmail: string
}

function SuccessContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const [order, setOrder] = useState<OrderDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const { clearCart } = useCart()

  useEffect(() => {
    sessionStorage.removeItem('souqify-checkout-secret')
    if (!sessionId) {
      setLoading(false)
      return
    }
    fetch(`/api/orders/by-session?session_id=${sessionId}`)
      .then((res) => res.json())
      .then((data) => {
        setOrder(data)
        if (data?.orderId) clearCart()
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [sessionId, clearCart])

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 aria-hidden className="h-8 w-8 animate-spin text-verdigris" />
        <span className="sr-only">Chargement de votre commande…</span>
      </div>
    )
  }

  if (!order || !order.orderId) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <h1 className="font-display text-2xl text-ink">
          Commande introuvable
        </h1>
        <p className="mt-2 text-dust">
          Si vous venez de payer, vous recevrez l’email de confirmation dans
          quelques minutes. Toujours rien ? Écrivez-nous à{' '}
          <a href="mailto:contact@souqify.fr" className="text-verdigris-deep hover:underline">
            contact@souqify.fr
          </a>.
        </p>
        <Link href="/" className="mt-6 inline-block font-semibold text-verdigris-deep hover:underline">
          Retour au catalogue
        </Link>
      </div>
    )
  }

  return (
    <div className="bg-stone">
      <div className="container mx-auto max-w-2xl px-4 py-12">
        <div className="rounded-xl border border-hairline bg-surface p-8 text-center shadow-carte">
          <CheckCircle2 aria-hidden className="mx-auto h-12 w-12 text-verdigris-deep" />
          <h1 className="mt-4 font-display text-3xl tracking-tight text-ink">
            Merci pour votre commande.
          </h1>
          <p className="mt-2 text-dust">
            La confirmation part à{' '}
            <span className="font-medium text-ink">{order.customerEmail}</span>.
          </p>

          <div className="mt-6 rounded-lg bg-paper p-5 text-left">
            <p className="tag-label">Commande nº {order.orderId}</p>
            <ul className="mt-3 space-y-1.5 text-sm text-ink">
              {order.items.map((item, i) => (
                <li key={i} className="flex justify-between gap-4">
                  <span className="min-w-0 flex-1 truncate">
                    {item.name} × {item.quantity}
                  </span>
                  <span className="font-mono">{formatPrice(item.price * item.quantity)} €</span>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex justify-between border-t border-hairline pt-3 font-semibold text-ink">
              <span>Total</span>
              <span className="font-mono">{formatPrice(order.total)} €</span>
            </div>
          </div>

          <div className="mt-4 rounded-lg bg-verdigris/10 p-4 text-left text-sm leading-relaxed text-verdigris-deep">
            {order.shippingMethod === 'pickup' ? (
              <>
                <strong>Votre pièce vous attend à Bondues (59910).</strong> Passez
                du lundi au samedi, 9h–18h — pensez au coffre ou à la remorque
                pour les gros meubles.
              </>
            ) : (
              <>
                <strong>Expédition en préparation.</strong> Vous recevrez le
                numéro de suivi par email dès que le transporteur prend votre
                colis en charge.
              </>
            )}
          </div>

          <Link
            href="/"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-verdigris px-8 py-3 text-sm font-semibold text-stone transition-colors hover:bg-verdigris-deep"
          >
            Continuer à chiner
            <ArrowRight aria-hidden className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 aria-hidden className="h-8 w-8 animate-spin text-verdigris" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  )
}
