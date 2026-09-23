// What we promise a buyer about when their article arrives, computed per
// article and per mode rather than written out as a sentence.
//
// The reason it is computed: L111-1 and L216-1 require a delivery date or
// delay to be given before the order, and that date is what the seller is
// then bound by. A single hand-written "3 à 5 jours" copied onto the
// product page, the checkout and the email is how those three surfaces
// end up disagreeing, and the one the buyer screenshots is the one that
// counts. So there is one function, and every surface renders its output.
//
// Nothing here recomputes a promise after the fact: the order stores the
// sentence and the date it was given, so a later change to the numbers
// below cannot rewrite what a past buyer was told.

import { COMPANY } from '@/lib/company'
import { RELAY_MAX_KG, SHIPPING_LABELS, type ShippingMethod } from '@/lib/shipping'

const { delivery } = COMPANY

/** The shape of a product this module needs. Anything else is ignored. */
export interface DeliverableProduct {
  weight?: number | null
}

export interface DeliveryPromise {
  mode: ShippingMethod
  /** False when the mode cannot carry this article at all. */
  available: boolean
  /** The sentence shown to the buyer. Empty when unavailable. */
  text: string
  /** Why it is unavailable, for the UI to explain rather than hide. */
  unavailableReason?: string
  /**
   * The last day we commit to, as an absolute date. Always within
   * COMPANY.delivery.legalMaxDays of the order.
   */
  latestDate: Date
  /** True when legalMaxDays clipped the computed date. */
  cappedByLegalMax: boolean
}

// ---------------------------------------------------------------------
// Calendar
// ---------------------------------------------------------------------

/**
 * France's eleven jours fériés for a given year.
 *
 * Worth the twenty lines: a "jours ouvrés" count that only skips weekends
 * silently promises a May delivery one to three days earlier than the
 * warehouse or the carrier can manage, and the whole point of computing
 * the date is that we can keep it.
 */
function publicHolidays(year: number): Set<string> {
  // Anonymous Gregorian computus — Easter Sunday, which fixes lundi de
  // Pâques, l'Ascension and lundi de Pentecôte.
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31) // 3 = March, 4 = April
  const day = ((h + l - 7 * m + 114) % 31) + 1
  const easter = new Date(Date.UTC(year, month - 1, day))

  const fromEaster = (offset: number) => {
    const d2 = new Date(easter)
    d2.setUTCDate(d2.getUTCDate() + offset)
    return d2
  }

  return new Set(
    [
      new Date(Date.UTC(year, 0, 1)), // Jour de l'an
      fromEaster(1), // Lundi de Pâques
      new Date(Date.UTC(year, 4, 1)), // Fête du Travail
      new Date(Date.UTC(year, 4, 8)), // Victoire 1945
      fromEaster(39), // Ascension
      fromEaster(50), // Lundi de Pentecôte
      new Date(Date.UTC(year, 6, 14)), // Fête nationale
      new Date(Date.UTC(year, 7, 15)), // Assomption
      new Date(Date.UTC(year, 10, 1)), // Toussaint
      new Date(Date.UTC(year, 10, 11)), // Armistice 1918
      new Date(Date.UTC(year, 11, 25)), // Noël
    ].map(isoDay)
  )
}

function isoDay(d: Date): string {
  return d.toISOString().slice(0, 10)
}

const holidayCache = new Map<number, Set<string>>()
function isBusinessDay(d: Date): boolean {
  const weekday = d.getUTCDay()
  if (weekday === 0 || weekday === 6) return false
  const year = d.getUTCFullYear()
  if (!holidayCache.has(year)) holidayCache.set(year, publicHolidays(year))
  return !holidayCache.get(year)!.has(isoDay(d))
}

/** `from` plus `n` business days, at UTC midnight. */
export function addBusinessDays(from: Date, n: number): Date {
  const d = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()))
  let remaining = n
  while (remaining > 0) {
    d.setUTCDate(d.getUTCDate() + 1)
    if (isBusinessDay(d)) remaining -= 1
  }
  return d
}

/** `from` plus `n` calendar days, at UTC midnight. */
export function addCalendarDays(from: Date, n: number): Date {
  const d = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()))
  d.setUTCDate(d.getUTCDate() + n)
  return d
}

/** "8 octobre 2026" — the form a delivery date is read in, not dd/mm. */
export function formatDeliveryDate(d: Date): string {
  return d.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

// ---------------------------------------------------------------------
// The promise
// ---------------------------------------------------------------------

/** True when a single article can physically go through a parcel relay. */
export function isRelayEligible(product: DeliverableProduct): boolean {
  return (product.weight || 0) <= RELAY_MAX_KG
}

const [PREP_MIN, PREP_MAX] = delivery.preparationBusinessDays
const [TRANSIT_MIN, TRANSIT_MAX] = delivery.mondialRelay.transitBusinessDays
const [COCOLIS_MIN, COCOLIS_MAX] = delivery.cocolis.typicalDays

/** Preparation + transit, so the two numbers can never drift apart. */
export const RELAY_TOTAL_BUSINESS_DAYS: [number, number] = [
  PREP_MIN + TRANSIT_MIN,
  PREP_MAX + TRANSIT_MAX,
]

/**
 * The delivery promise for one article by one mode.
 *
 * `from` is the moment the contract is concluded — payment. It is a
 * parameter rather than `new Date()` so the checkout can pin the date it
 * actually told the buyer, and so the tests are not time-dependent.
 */
export function getDeliveryPromise(
  product: DeliverableProduct,
  mode: ShippingMethod,
  from: Date = new Date()
): DeliveryPromise {
  // The statutory ceiling, whatever the mode computes. L216-1: with no
  // other date agreed, delivery is due within 30 days of the contract.
  const legalLatest = addCalendarDays(from, delivery.legalMaxDays)

  const cap = (computed: Date): { latestDate: Date; cappedByLegalMax: boolean } =>
    computed > legalLatest
      ? { latestDate: legalLatest, cappedByLegalMax: true }
      : { latestDate: computed, cappedByLegalMax: false }

  switch (mode) {
    case 'pickup': {
      const days = delivery.pickup.readyWithinBusinessDays
      return {
        mode,
        available: true,
        text: `Disponible au retrait sous ${days} jours ouvrés, sur rendez-vous.`,
        ...cap(addBusinessDays(from, days)),
      }
    }

    case 'relay': {
      if (!isRelayEligible(product)) {
        return {
          mode,
          available: false,
          text: '',
          unavailableReason: `Article trop lourd pour un point relais (plus de ${RELAY_MAX_KG} kg).`,
          ...cap(legalLatest),
        }
      }
      const [min, max] = RELAY_TOTAL_BUSINESS_DAYS
      return {
        mode,
        available: true,
        text: `Livraison en point relais sous ${min} à ${max} jours ouvrés.`,
        ...cap(addBusinessDays(from, max)),
      }
    }

    case 'home':
    default: {
      // Cocolis matches a parcel with a driver already making the trip,
      // so there is no carrier grid to read a date off: the date is
      // agreed between the buyer and the driver. Saying so is more
      // useful than a precise-looking number we do not control.
      return {
        mode: 'home',
        available: true,
        text: `Livraison à domicile à une ${delivery.cocolis.label}, généralement sous ${COCOLIS_MIN} à ${COCOLIS_MAX} jours.`,
        ...cap(addCalendarDays(from, COCOLIS_MAX)),
      }
    }
  }
}

/**
 * The same promise for a whole cart. Preparation and transit do not
 * change with the number of articles; only relay eligibility does, and
 * the cart's heaviest article decides it — which is what
 * getShippingQuotes already enforces on the price side.
 */
export function getCartDeliveryPromise(
  weightsKg: number[],
  mode: ShippingMethod,
  from: Date = new Date()
): DeliveryPromise {
  const heaviest = weightsKg.length > 0 ? Math.max(...weightsKg) : 0
  return getDeliveryPromise({ weight: heaviest }, mode, from)
}

/** "Point relais — Livraison en point relais sous 4 à 9 jours ouvrés." */
export function describePromise(promise: DeliveryPromise): string {
  return `${SHIPPING_LABELS[promise.mode]} — ${promise.text}`
}
