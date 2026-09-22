'use client'

import Link from 'next/link'
import { useConsent } from '@/lib/consent'

const GA_ENABLED = Boolean(process.env.NEXT_PUBLIC_GA_ID)

/**
 * A real consent gate, not the disclosure notice this used to be.
 *
 * Until GA4, nothing on this site needed opt-in: every cookie was
 * strictly necessary and Vercel Web Analytics writes none, so a
 * dismissible "Compris" banner was the honest shape. GA4 changes that.
 * It is a non-exempt tracker under art. 82 of the loi Informatique et
 * Libertés and needs prior, freely given consent.
 *
 * Which means: refusing is one click, exactly like accepting, with the
 * same visual weight. No pre-ticked anything, no "continue browsing to
 * accept", no dark pattern where "Refuser" hides behind "Personnaliser".
 * Closing without choosing leaves the decision null, and null is treated
 * as denied everywhere.
 *
 * With no GA_ID configured there is still nothing to consent to, so this
 * falls back to the disclosure it was, and nothing is asked of anybody.
 */
export default function CookieNotice() {
  const { decision, hydrated, reopened, accept, refuse } = useConsent()

  // Waiting for localStorage before painting: rendering first would flash
  // the banner at every returning visitor who already decided.
  if (!hydrated) return null

  const needsDecision = GA_ENABLED && (decision === null || reopened)
  const showDisclosureOnly = !GA_ENABLED && (decision === null || reopened)

  if (!needsDecision && !showDisclosureOnly) return null

  return (
    <div
      role={needsDecision ? 'dialog' : 'status'}
      aria-modal={false}
      aria-label="Gestion des cookies"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-hairline bg-surface/97 px-4 py-4 shadow-levee backdrop-blur print:hidden"
    >
      <div className="container mx-auto flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        {needsDecision ? (
          <p className="max-w-2xl text-sm leading-relaxed text-ink">
            Ce site utilise des cookies strictement nécessaires à son fonctionnement (connexion,
            panier, paiement sécurisé Stripe), déposés sans votre accord car indispensables. Nous
            aimerions aussi mesurer l’audience avec Google Analytics, ce qui dépose des cookies :
            cela nécessite votre accord, et vous pouvez refuser sans conséquence sur votre
            navigation.{' '}
            <Link href="/politique-cookies" className="font-semibold text-verdigris-deep hover:underline">
              En savoir plus
            </Link>
          </p>
        ) : (
          <p className="max-w-2xl text-sm leading-relaxed text-ink">
            Ce site utilise des cookies strictement nécessaires à son fonctionnement (connexion,
            panier, paiement sécurisé Stripe) et une mesure d’audience anonyme, sans cookie ni
            identifiant. Aucun cookie publicitaire ou de traçage.{' '}
            <Link href="/politique-cookies" className="font-semibold text-verdigris-deep hover:underline">
              En savoir plus
            </Link>
          </p>
        )}

        {needsDecision ? (
          <div className="flex shrink-0 gap-2 self-end sm:self-auto">
            {/* Equal weight on purpose: refusing must be as easy as accepting. */}
            <button
              type="button"
              onClick={refuse}
              className="rounded-full border border-hairline-strong px-5 py-2 text-sm font-semibold text-ink transition-colors hover:border-ink"
            >
              Refuser
            </button>
            <button
              type="button"
              onClick={accept}
              className="rounded-full bg-verdigris px-5 py-2 text-sm font-semibold text-stone transition-colors hover:bg-verdigris-deep"
            >
              Accepter
            </button>
          </div>
        ) : (
          // Records a decision rather than a dismissal, so it persists
          // and the notice does not return on the next page. With no
          // tracker to consent to, "denied" and "dismissed" are the same
          // state, and the safe one.
          <button
            type="button"
            onClick={refuse}
            className="shrink-0 self-end rounded-full bg-verdigris px-5 py-2 text-sm font-semibold text-stone transition-colors hover:bg-verdigris-deep sm:self-auto"
          >
            Compris
          </button>
        )}
      </div>
    </div>
  )
}
