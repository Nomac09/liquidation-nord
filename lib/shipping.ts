// Single source of truth for delivery pricing — tune every number here,
// nowhere else. Used both client-side (cart page: what to show/offer) and
// server-side (checkout route: what to actually charge) so the two can
// never drift apart or be gamed by a tampered client request.

export const SHIPPING_METHODS = ['pickup', 'relay', 'home'] as const
export type ShippingMethod = (typeof SHIPPING_METHODS)[number]

export const SHIPPING_LABELS: Record<ShippingMethod, string> = {
  pickup: 'Retrait à Bondues',
  relay: 'Point relais',
  home: 'À domicile',
}

// Mondial Relay's published Point Relais limits (mondialrelay.fr FAQ,
// "Quelle est la taille maximale des colis ?"): 30 kg per parcel, longest
// side under 120 cm, and the sum of the three dimensions (L+l+h) no more
// than 150 cm. These are the public network limits; if this account's own
// contract with Mondial Relay states different figures, those take
// precedence and these three constants are the ones to change — every
// eligibility check and size-class assignment reads from here.
export const RELAY_MAX_KG = 30
export const RELAY_MAX_LONGEST_SIDE_CM = 120
export const RELAY_MAX_SUM_DIMENSIONS_CM = 150

interface WeightBand {
  // Inclusive upper edge of this band, in kg.
  maxKg: number
  price: number
}

// Bands must be sorted ascending by maxKg; the first band whose maxKg
// covers the cart's total weight is the one that applies.
export const RELAY_BANDS: WeightBand[] = [
  { maxKg: 8, price: 29.99 },
  { maxKg: 15, price: 34.99 },
  { maxKg: 22, price: 44.99 },
  { maxKg: RELAY_MAX_KG, price: 54.99 },
]

// No eligibility ceiling — a van can take what a locker can't — but
// capped at the last band's price so a huge multi-item order never
// produces an absurd fee. Infinity as the final maxKg *is* that cap.
export const HOME_BANDS: WeightBand[] = [
  { maxKg: 15, price: 79.99 },
  { maxKg: 30, price: 94.99 },
  { maxKg: 50, price: 109.99 },
  { maxKg: 80, price: 129.99 },
  { maxKg: Infinity, price: 149.99 },
]

function priceForBands(totalKg: number, bands: WeightBand[]): number {
  const band = bands.find((b) => totalKg <= b.maxKg)
  return (band ?? bands[bands.length - 1]).price
}

export interface ShippingQuote {
  method: ShippingMethod
  available: boolean
  cost: number
  // Why `available` is false — only set in that case.
  reason?: 'item-too-heavy' | 'cart-too-heavy'
}

// `itemWeightsKg` — one entry per unit in the cart. A single oversized
// item disqualifies Mondial Relay even if the cart's total would
// otherwise fit under the cap: a parcel locker can't split one physical
// piece across multiple parcels the way a heavier multi-item cart can
// conceptually be treated as needing "more than one parcel's worth."
export function getShippingQuotes(itemWeightsKg: number[]): Record<ShippingMethod, ShippingQuote> {
  const totalKg = itemWeightsKg.reduce((sum, w) => sum + w, 0)
  const hasOversizedItem = itemWeightsKg.some((w) => w > RELAY_MAX_KG)
  const relayEligible = !hasOversizedItem && totalKg <= RELAY_MAX_KG

  return {
    pickup: { method: 'pickup', available: true, cost: 0 },
    relay: relayEligible
      ? { method: 'relay', available: true, cost: priceForBands(totalKg, RELAY_BANDS) }
      : {
          method: 'relay',
          available: false,
          cost: 0,
          reason: hasOversizedItem ? 'item-too-heavy' : 'cart-too-heavy',
        },
    home: { method: 'home', available: true, cost: priceForBands(totalKg, HOME_BANDS) },
  }
}

// ---------------------------------------------------------------------
// Returns
// ---------------------------------------------------------------------

/** "29,99" — the bare number, for embedding in a sentence. */
function amount(n: number): string {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export interface ReturnCostEstimate {
  /** Estimated cost to the buyer of sending the article back, in euros. */
  cost: number
  /** True when the article is too heavy for a relay and needs Cocolis. */
  bulky: boolean
  /** The sentence shown to the buyer. */
  label: string
  /** The free alternative. Already folded into `label` when bulky. */
  freeReturnNote: string
}

const FREE_RETURN_NOTE = 'Retour gratuit si vous le rapportez à l’entrepôt.'

/**
 * What it would cost this buyer to send this article back.
 *
 * Required, not a courtesy: art. L221-5 makes the trader state the cost
 * of returning goods that cannot normally go back by post, and art.
 * L221-23 says a buyer who was never told that cost does not owe it. So
 * an estimate that is roughly right and on the page beats an exact figure
 * nobody published.
 *
 * The estimate is our own outbound tariff for the same weight band. It is
 * the closest honest number we have: the buyer is free to use any
 * carrier, and might pay less.
 */
export function getReturnCostEstimate(product: { weight?: number | null }): ReturnCostEstimate {
  const weight = product.weight || 0
  const bulky = weight > RELAY_MAX_KG

  if (bulky) {
    const cost = priceForBands(weight, HOME_BANDS)
    return {
      cost,
      bulky: true,
      label:
        `Article volumineux : en cas de rétractation, retour à vos frais, coût estimé ${amount(cost)} €. ` +
        'Vous pouvez aussi le rapporter gratuitement à l’entrepôt de Bondues sur rendez-vous.',
      freeReturnNote: FREE_RETURN_NOTE,
    }
  }

  const cost = priceForBands(weight, RELAY_BANDS)
  return {
    cost,
    bulky: false,
    label: `Retour possible en point relais, à vos frais (environ ${amount(cost)} €).`,
    freeReturnNote: FREE_RETURN_NOTE,
  }
}

/**
 * The estimate as the lines to render, in order.
 *
 * The free-warehouse return is always stated. For a bulky article the
 * label already says it, in more words and in the place it matters most,
 * so repeating it verbatim underneath would read as a stutter rather than
 * as emphasis.
 */
export function returnCostLines(estimate: ReturnCostEstimate): string[] {
  return estimate.bulky ? [estimate.label] : [estimate.label, estimate.freeReturnNote]
}
