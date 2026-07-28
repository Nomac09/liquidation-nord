'use client'

import { useState } from 'react'
import { MailWarning } from 'lucide-react'

export default function EmailVerificationBanner({ className = '' }: { className?: string }) {
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  const resend = async () => {
    setState('sending')
    const res = await fetch('/api/auth/resend-verification', { method: 'POST' })
    setState(res.ok ? 'sent' : 'error')
  }

  return (
    <div className={`flex items-start gap-3 rounded-xl border border-alert/30 bg-alert-pale px-4 py-3 text-sm text-alert ${className}`}>
      <MailWarning aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0">
        <p className="font-semibold">Email non confirmé</p>
        <p className="mt-0.5">
          Confirmez votre adresse pour pouvoir passer commande — vérifiez votre boîte de réception.
        </p>
        {state === 'sent' ? (
          <p className="mt-2 text-xs font-semibold">Email renvoyé.</p>
        ) : (
          <button
            type="button"
            onClick={resend}
            disabled={state === 'sending'}
            className="mt-2 text-xs font-semibold underline-offset-2 hover:underline disabled:opacity-60"
          >
            {state === 'sending' ? 'Envoi…' : 'Renvoyer l’email de confirmation'}
          </button>
        )}
        {state === 'error' && (
          <p className="mt-1 text-xs">
            L’envoi a échoué — réessayez dans une minute, ou écrivez-nous à contact@souqify.fr.
          </p>
        )}
      </div>
    </div>
  )
}
