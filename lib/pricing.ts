// How a Souqify price is decided.
//
// Every price is TTC. The comparison price shown beside it is a price
// observed at another retailer on a stated day, which is a different
// thing from a reduction and is why art. L112-1-1 (directive Omnibus)
// does not apply to it: an announced reduction must be measured against
// our own lowest price of the preceding 30 days, and we never had one.
// Two rules keep that true rather than merely stated in the CGV:
//
//   1. a comparison is only ever shown with the date it was observed, and
//   2. an observation older than COMPARE_STALE_DAYS is not shown at all.
//
// The price itself is stored, not derived at render time. A price that
// recomputes on every page load is a price that can change between the
// product page and the basket, which is the one thing a shop must never
// do.

/** The only retailer we compare against today. */
export const COMPARE_SOURCE = 'vidaXL.fr' as const

/** The discount is a business decision, but never outside these bounds. */
export const DISCOUNT_MIN = 20
export const DISCOUNT_MAX = 60

/** After this, a comparison is history rather than a comparison. */
export const COMPARE_STALE_DAYS = 90

/** Extra points for stock that has not moved. */
export const AGED_STOCK_DAYS = 90
export const AGED_STOCK_BONUS = 10

/**
 * Stripe's standard French rate for cards issued in the EEA: 1,5 % + 25 c.
 * Cards from outside the EEA cost more, and so does a chargeback, so the
 * margin floor below is the optimistic case, not the guaranteed one.
 * Payment services are exempt from TVA (art. 261 C du CGI), which is why
 * the fee is not divided by 1,2 anywhere.
 */
export const STRIPE_FEE_PERCENT = 0.015
export const STRIPE_FEE_FIXED = 0.25

export function stripeFee(priceTtc: number): number {
  return round2(priceTtc * STRIPE_FEE_PERCENT + STRIPE_FEE_FIXED)
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100
}

// ---------------------------------------------------------------------
// The condition grid
// ---------------------------------------------------------------------

export type ConditionKey =
  | 'neuf-emballage-intact'
  | 'neuf-emballage-ouvert'
  | 'open-box-complet'
  | 'defaut-signale'
  | 'inconnu'

export interface ConditionRow {
  key: ConditionKey
  label: string
  discount: number
  /** Words that identify this condition in the free-text fields. */
  keywords: string[]
}

/**
 * The default grid. Applied once by scripts/reprice.ts, then editable per
 * product: `discountPercent` is stored on the product, so a later change
 * here does not silently reprice the catalogue.
 */
export const CONDITION_GRID: ConditionRow[] = [
  {
    key: 'neuf-emballage-intact',
    label: "Neuf, emballage d'origine intact",
    discount: 25,
    keywords: ['neuf', 'emballage intact', 'emballage d’origine', "emballage d'origine", 'scellé', 'jamais ouvert'],
  },
  {
    key: 'neuf-emballage-ouvert',
    label: 'Neuf, emballage ouvert ou abîmé',
    discount: 35,
    keywords: ['emballage ouvert', 'emballage abîmé', 'emballage abime', 'carton abîmé', 'carton abime', 'boîte abîmée'],
  },
  {
    key: 'open-box-complet',
    label: 'Open-box, complet, sans défaut visible',
    discount: 40,
    keywords: ['open-box', 'open box', 'openbox', 'retour client', 'complet'],
  },
  {
    key: 'defaut-signale',
    label: 'Défaut esthétique ou accessoire mineur manquant, signalé',
    discount: 50,
    keywords: ['défaut', 'defaut', 'rayure', 'rayé', 'raye', 'éraflure', 'accessoire manquant', 'manquant', 'griffure', 'impact'],
  },
]

/** When nothing in the text identifies a condition. Overridable per run. */
export const DEFAULT_CONDITION_KEY: ConditionKey = 'open-box-complet'

export function conditionRow(key: ConditionKey): ConditionRow {
  return (
    CONDITION_GRID.find((r) => r.key === key) ??
    CONDITION_GRID.find((r) => r.key === DEFAULT_CONDITION_KEY)!
  )
}

/**
 * Classify an article from what it actually says about itself.
 *
 * Deliberately returns 'inconnu' rather than a confident guess when the
 * text says nothing: the caller decides what to do with an unknown, and
 * scripts/reprice.ts lists every one of them in its report rather than
 * quietly applying a middle number to stock nobody looked at.
 */
export function classifyCondition(product: {
  condition?: string | null
  conditionNote?: string | null
}): ConditionKey {
  const text = `${product.condition || ''} ${product.conditionNote || ''}`
    .toLowerCase()
    .trim()
  if (!text) return 'inconnu'

  // Most specific first: "emballage ouvert" must win over the bare "neuf"
  // that usually sits next to it, and a reported defect wins over
  // everything, because it is the thing the buyer is being warned about.
  const order: ConditionKey[] = [
    'defaut-signale',
    'neuf-emballage-ouvert',
    'open-box-complet',
    'neuf-emballage-intact',
  ]
  for (const key of order) {
    const row = conditionRow(key)
    if (row.keywords.some((word) => text.includes(word))) return key
  }
  return 'inconnu'
}

// ---------------------------------------------------------------------
// The discount
// ---------------------------------------------------------------------

export function clampDiscount(percent: number): number {
  return Math.min(DISCOUNT_MAX, Math.max(DISCOUNT_MIN, Math.round(percent)))
}

/** Whole days between two dates, floor. */
export function daysBetween(from: Date, to: Date): number {
  return Math.floor((to.getTime() - from.getTime()) / 86_400_000)
}

export interface DiscountDecision {
  conditionKey: ConditionKey
  conditionLabel: string
  baseDiscount: number
  agedBonus: number
  discountPercent: number
  agedDays: number
}

/**
 * The grid discount for an article, plus the aged-stock bonus, clamped.
 *
 * `now` is a parameter so the result is reproducible: a repricing run
 * that gives different answers on different afternoons is one nobody can
 * review.
 */
export function decideDiscount(
  product: { condition?: string | null; conditionNote?: string | null; createdAt?: Date | string | null },
  options: { now?: Date; fallbackCondition?: ConditionKey } = {}
): DiscountDecision {
  const now = options.now ?? new Date()
  const detected = classifyCondition(product)
  const conditionKey =
    detected === 'inconnu' ? (options.fallbackCondition ?? DEFAULT_CONDITION_KEY) : detected
  const row = conditionRow(conditionKey)

  const created = product.createdAt ? new Date(product.createdAt) : null
  const agedDays = created && !Number.isNaN(created.getTime()) ? daysBetween(created, now) : 0
  const agedBonus = agedDays > AGED_STOCK_DAYS ? AGED_STOCK_BONUS : 0

  return {
    conditionKey: detected,
    conditionLabel: detected === 'inconnu' ? `${row.label} (présumé)` : row.label,
    baseDiscount: row.discount,
    agedBonus,
    agedDays,
    discountPercent: clampDiscount(row.discount + agedBonus),
  }
}

// ---------------------------------------------------------------------
// The price
// ---------------------------------------------------------------------

/**
 * Round DOWN to the nearest price ending in ,90 or ,50.
 *
 * Down, never to the nearest: rounding up would mean the stated discount
 * is not the discount actually given, and a percentage that does not
 * match the arithmetic on the same line is the kind of thing a DGCCRF
 * check looks for. 43,72 € becomes 43,50 €; 43,95 € becomes 43,90 €;
 * 43,00 € becomes 42,90 €.
 *
 * Floored at 0,50 € so a cheap article cannot round to zero or below.
 */
export function roundToPsych(value: number): number {
  if (!Number.isFinite(value) || value <= 0.5) return 0.5
  const whole = Math.floor(value + 1e-9)
  const candidates = [whole + 0.9, whole + 0.5, whole - 0.1]
  for (const candidate of candidates) {
    if (candidate <= value + 1e-9 && candidate >= 0.5) return round2(candidate)
  }
  return 0.5
}

export function priceFromCompare(comparePrice: number, discountPercent: number): number {
  return roundToPsych(comparePrice * (1 - discountPercent / 100))
}

export interface MarginCheck {
  /** False when the sale would not cover the cost and the card fee. */
  passes: boolean
  /** HT margin after the Stripe fee. Null when unitCost is unknown. */
  marginHT: number | null
}

/**
 * Does this price still cover what the article cost us, plus the card fee?
 *
 * Everything is compared HT because the TVA collected is not ours: it is
 * held for the Trésor. The Stripe fee is not divided, being exempt.
 *
 * With no unitCost there is nothing to check, and the answer is "yes",
 * not "no": an unknown cost must not block a repricing run, it must show
 * up as unknown in the report.
 */
export function checkMarginFloor(priceTtc: number, unitCost?: number | null): MarginCheck {
  if (!unitCost || unitCost <= 0) return { passes: true, marginHT: null }
  const marginHT = round2(priceTtc / 1.2 - stripeFee(priceTtc) - unitCost / 1.2)
  return { passes: marginHT >= 0, marginHT }
}

// ---------------------------------------------------------------------
// The comparison, as shown
// ---------------------------------------------------------------------

export interface ComparisonDisplay {
  /** False when nothing about the comparison may be shown. */
  show: boolean
  /** Why not, for the repricing report. */
  reason?: 'no-compare-price' | 'no-date' | 'stale' | 'not-cheaper'
  comparePrice?: number
  checkedAt?: Date
  /** "01/10/2026" */
  checkedAtLabel?: string
  discountPercent?: number
  source?: string
}

/** "01/10/2026" — dd/mm/yyyy, as the spec fixes it. */
export function formatCheckedAt(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getUTCDate())}/${pad(d.getUTCMonth() + 1)}/${d.getUTCFullYear()}`
}

/**
 * Whether the comparison line and the badge may be shown, and with what.
 *
 * A comparison with no date is never shown. That is the whole point: an
 * undated "was 120 €" is indistinguishable from a claim about our own
 * former price, which is exactly what we are not allowed to imply.
 */
export function getComparisonDisplay(
  product: {
    price?: number | null
    salePrice?: number | null
    comparePrice?: number | null
    comparePriceCheckedAt?: Date | string | null
    comparePriceSource?: string | null
    discountPercent?: number | null
  },
  now: Date = new Date()
): ComparisonDisplay {
  const price = product.price ?? product.salePrice ?? 0
  const comparePrice = product.comparePrice ?? 0
  if (!comparePrice || comparePrice <= 0) return { show: false, reason: 'no-compare-price' }
  if (comparePrice <= price) return { show: false, reason: 'not-cheaper' }

  if (!product.comparePriceCheckedAt) return { show: false, reason: 'no-date' }
  const checkedAt = new Date(product.comparePriceCheckedAt)
  if (Number.isNaN(checkedAt.getTime())) return { show: false, reason: 'no-date' }
  if (daysBetween(checkedAt, now) > COMPARE_STALE_DAYS) {
    return { show: false, reason: 'stale', comparePrice, checkedAt }
  }

  return {
    show: true,
    comparePrice,
    checkedAt,
    checkedAtLabel: formatCheckedAt(checkedAt),
    // The stored figure, not one recomputed from the two prices: the
    // badge must state the discount that was actually applied, and
    // roundToPsych means the arithmetic no longer lands on a round number.
    discountPercent: product.discountPercent ?? undefined,
    source: product.comparePriceSource || COMPARE_SOURCE,
  }
}
