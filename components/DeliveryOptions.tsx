import {
  getShippingQuotes,
  getReturnCostEstimate,
  returnCostLines,
  SHIPPING_METHODS,
  SHIPPING_LABELS,
} from '@/lib/shipping'
import { getDeliveryPromise } from '@/lib/delivery'
import { formatPrice } from '@/components/Sticker'

/**
 * The three ways to get this article, each with its price and the delay
 * that applies to *this* article.
 *
 * On the product page rather than only at checkout on purpose: L111-1
 * wants the delivery date or delay known before the buyer commits, and a
 * delay first seen on the payment step is a delay found out too late.
 * A mode that cannot carry the article says so instead of disappearing,
 * because "no relay option" and "relay option I did not notice" look
 * identical to someone scanning the page.
 */
export default function DeliveryOptions({ weightKg = 0 }: { weightKg?: number }) {
  const quotes = getShippingQuotes([weightKg])
  const returnLines = returnCostLines(getReturnCostEstimate({ weight: weightKg }))

  return (
    <section aria-label="Livraison et retrait" className="mt-10 border-t border-hairline pt-8">
      <h2 className="font-mono text-[11px] uppercase tracking-[0.14em] text-dust">
        Livraison et retrait
      </h2>
      <ul className="mt-3 divide-y divide-hairline">
        {SHIPPING_METHODS.map((mode) => {
          const quote = quotes[mode]
          const promise = getDeliveryPromise({ weight: weightKg }, mode)
          const available = quote.available && promise.available

          return (
            <li key={mode} className="flex items-start justify-between gap-4 py-3">
              <div className="min-w-0">
                <p
                  className={`text-sm font-semibold ${available ? 'text-ink' : 'text-dust line-through'}`}
                >
                  {SHIPPING_LABELS[mode]}
                </p>
                <p className="mt-0.5 font-karla text-[13px] leading-relaxed text-ink/75">
                  {available
                    ? promise.text
                    : promise.unavailableReason ||
                      'Indisponible pour cet article.'}
                </p>
              </div>
              {available && (
                <p className="shrink-0 font-mono text-sm text-ink">
                  {quote.cost === 0 ? 'Gratuit' : `${formatPrice(quote.cost)} €`}
                </p>
              )}
            </li>
          )
        })}
      </ul>
      <p className="mt-3 font-karla text-[13px] leading-relaxed text-dust">
        Les délais courent à compter de la confirmation du paiement. Jours ouvrés, hors samedis,
        dimanches et jours fériés.
      </p>

      {/*
        Art. L221-5 : the cost of sending a bulky article back has to be
        stated before the order. Art. L221-23 : a buyer who was never
        told it does not owe it. So this line is not a courtesy.
      */}
      <div className="mt-5 border-t border-hairline pt-5">
        <h3 className="font-mono text-[11px] uppercase tracking-[0.14em] text-dust">Retours</h3>
        <p className="mt-2 font-karla text-[13px] leading-relaxed text-ink/85">
          Vous disposez de 14 jours après réception pour changer d’avis, sans avoir à vous justifier.
        </p>
        {returnLines.map((line) => (
          <p key={line} className="mt-1.5 font-karla text-[13px] leading-relaxed text-ink/85">
            {line}
          </p>
        ))}
      </div>
    </section>
  )
}
