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

// Mondial Relay's real per-parcel weight limit. Currently an assumed
// ~30kg pending confirmation against the actual contracted limit — this
// is the one number to change once that's confirmed; everything that
// depends on it (eligibility, the top relay band) reads from here.
export const RELAY_MAX_KG = 30

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
