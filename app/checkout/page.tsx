'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js'
import { ChevronLeft } from 'lucide-react'
import { getStripe } from '@/lib/stripeClient'

// Payment happens on-site now, not on a separate Stripe-branded page —
// the cart already created the session and stashed its clientSecret here
// (sessionStorage, not the URL: short-lived, not something to bookmark or
// leave sitting in browser history).
export default function CheckoutPage() {
  const router = useRouter()
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const stored = sessionStorage.getItem('souqify-checkout-secret')
    if (!stored) {
      router.replace('/cart')
      return
    }
    setClientSecret(stored)
    setReady(true)
  }, [router])

  if (!ready || !clientSecret) {
    return (
      <div className="container mx-auto flex min-h-[50vh] items-center justify-center px-4">
        <p className="font-mono text-[11px] uppercase tracking-widest text-gris">Chargement du paiement…</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <Link href="/cart" className="mb-6 inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-widest text-gris hover:text-encre">
        <ChevronLeft aria-hidden className="h-3.5 w-3.5" />
        Retour au panier
      </Link>

      <div className="overflow-hidden rounded-xl border border-ligne bg-blanc shadow-carte">
        <div className="border-b border-ligne px-6 py-4">
          <h1 className="tag-label">Paiement sécurisé</h1>
        </div>
        <div className="p-1 sm:p-2">
          <EmbeddedCheckoutProvider stripe={getStripe()} options={{ clientSecret }}>
            <EmbeddedCheckout />
          </EmbeddedCheckoutProvider>
        </div>
      </div>

      <p className="mt-4 text-center font-mono text-[10px] uppercase tracking-widest text-gris">
        Paiement traité par Stripe · TVA non applicable, art. 293 B du CGI
      </p>
    </div>
  )
}
