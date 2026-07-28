'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { X } from 'lucide-react'

const KEY = 'souqify-cookie-notice-dismissed'

// Not a consent gate — there's nothing on this site that needs opt-in.
// Every cookie set (login session, Stripe payment) is strictly necessary,
// and the only audience-measurement tool (Vercel Web Analytics) writes no
// cookie and no persistent identifier at all. This is disclosure only:
// a dismissible notice, not an accept/refuse choice, per CNIL guidance
// that only non-essential trackers require an opt-in gate.
export default function CookieNotice() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!window.localStorage.getItem(KEY)) setVisible(true)
  }, [])

  const dismiss = () => {
    window.localStorage.setItem(KEY, '1')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      role="status"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-hairline bg-surface/97 px-4 py-4 shadow-levee backdrop-blur"
    >
      <div className="container mx-auto flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-2xl text-sm leading-relaxed text-ink">
          Ce site utilise des cookies strictement nécessaires à son fonctionnement (connexion, panier, paiement
          sécurisé Stripe) et une mesure d’audience anonyme, sans cookie ni identifiant. Aucun cookie publicitaire
          ou de traçage.{' '}
          <Link href="/politique-cookies" className="font-semibold text-verdigris-deep hover:underline">
            En savoir plus
          </Link>
        </p>
        <button
          type="button"
          onClick={dismiss}
          className="flex shrink-0 items-center gap-2 self-end rounded-full bg-verdigris px-5 py-2 text-sm font-semibold text-stone transition-colors hover:bg-verdigris-deep sm:self-auto"
        >
          Compris
          <X aria-hidden className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
