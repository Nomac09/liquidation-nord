import { describe, it, expect } from 'vitest'
import {
  addBusinessDays,
  addCalendarDays,
  formatDeliveryDate,
  getCartDeliveryPromise,
  getDeliveryPromise,
  isRelayEligible,
} from '@/lib/delivery'
import { getReturnCostEstimate, returnCostLines, RELAY_MAX_KG } from '@/lib/shipping'
import { COMPANY } from '@/lib/company'

// A Thursday, deliberately: most of these land over a weekend.
const THURSDAY = new Date(Date.UTC(2026, 9, 1))

// A relay-eligible article and a Cocolis-only one, the two cases the
// whole of Tasks 2 and 3 turns on.
const PARASOL = { weight: 2.25 }
const TONNELLE = { weight: 54.05 }

describe('business days', () => {
  it('skips weekends', () => {
    // Thu 1 Oct + 2 ouvrés = Mon 5 Oct.
    expect(formatDeliveryDate(addBusinessDays(THURSDAY, 2))).toBe('5 octobre 2026')
  })

  it('skips French public holidays too', () => {
    // Thu 30 Apr 2026 + 3 ouvrés: Fri 1 May is the Fête du Travail, so
    // Mon 4, Tue 5, Wed 6. A weekend-only counter would say Tue 5.
    expect(formatDeliveryDate(addBusinessDays(new Date(Date.UTC(2026, 3, 30)), 3))).toBe(
      '6 mai 2026'
    )
    // Easter Monday 2026 is 6 April.
    expect(formatDeliveryDate(addBusinessDays(new Date(Date.UTC(2026, 3, 3)), 1))).toBe(
      '7 avril 2026'
    )
  })

  it('counts calendar days without skipping anything', () => {
    expect(formatDeliveryDate(addCalendarDays(THURSDAY, 15))).toBe('16 octobre 2026')
  })
})

describe('getDeliveryPromise', () => {
  it('promises collection within two business days', () => {
    const promise = getDeliveryPromise(PARASOL, 'pickup', THURSDAY)
    expect(promise.available).toBe(true)
    expect(promise.text).toBe('Disponible au retrait sous 2 jours ouvrés, sur rendez-vous.')
    expect(formatDeliveryDate(promise.latestDate)).toBe('5 octobre 2026')
  })

  it('adds preparation to transit for a relay parcel', () => {
    const promise = getDeliveryPromise(PARASOL, 'relay', THURSDAY)
    expect(promise.available).toBe(true)
    // 1..3 preparation + 3..6 transit.
    expect(promise.text).toContain('sous 4 à 9 jours ouvrés')
    expect(formatDeliveryDate(promise.latestDate)).toBe('14 octobre 2026')
  })

  it('refuses a relay for an article above the weight cap, and says why', () => {
    expect(isRelayEligible(TONNELLE)).toBe(false)
    const promise = getDeliveryPromise(TONNELLE, 'relay', THURSDAY)
    expect(promise.available).toBe(false)
    expect(promise.text).toBe('')
    expect(promise.unavailableReason).toContain(`${RELAY_MAX_KG} kg`)
  })

  it('keeps a relay for an article exactly at the cap', () => {
    expect(getDeliveryPromise({ weight: RELAY_MAX_KG }, 'relay', THURSDAY).available).toBe(true)
    expect(getDeliveryPromise({ weight: RELAY_MAX_KG + 0.01 }, 'relay', THURSDAY).available).toBe(
      false
    )
  })

  it('states a Cocolis delivery as an agreed date, not a carrier grid', () => {
    const promise = getDeliveryPromise(TONNELLE, 'home', THURSDAY)
    expect(promise.available).toBe(true)
    expect(promise.text).toBe(
      'Livraison à domicile à une date convenue avec vous par Cocolis, généralement sous 7 à 15 jours.'
    )
    expect(formatDeliveryDate(promise.latestDate)).toBe('16 octobre 2026')
  })

  it('never promises beyond the statutory 30 days', () => {
    const limit = addCalendarDays(THURSDAY, COMPANY.delivery.legalMaxDays)
    for (const mode of ['pickup', 'relay', 'home'] as const) {
      const promise = getDeliveryPromise(PARASOL, mode, THURSDAY)
      expect(promise.latestDate.getTime()).toBeLessThanOrEqual(limit.getTime())
    }
  })

  it('reads a cart by its heaviest article', () => {
    expect(getCartDeliveryPromise([2.25, 54.05], 'relay', THURSDAY).available).toBe(false)
    expect(getCartDeliveryPromise([2.25, 3.1], 'relay', THURSDAY).available).toBe(true)
    expect(getCartDeliveryPromise([], 'relay', THURSDAY).available).toBe(true)
  })
})

describe('getReturnCostEstimate', () => {
  it('quotes the relay tariff for an article that fits a relay', () => {
    const estimate = getReturnCostEstimate(PARASOL)
    expect(estimate.bulky).toBe(false)
    expect(estimate.cost).toBe(29.99)
    expect(estimate.label).toBe('Retour possible en point relais, à vos frais (environ 29,99 €).')
  })

  it('quotes the Cocolis tariff for a bulky one, and offers the warehouse', () => {
    const estimate = getReturnCostEstimate(TONNELLE)
    expect(estimate.bulky).toBe(true)
    // 54,05 kg sits in the 50-80 kg Cocolis band.
    expect(estimate.cost).toBe(129.99)
    expect(estimate.label).toContain('Article volumineux')
    expect(estimate.label).toContain('coût estimé 129,99 €')
    expect(estimate.label).toContain('gratuitement à l’entrepôt de Bondues')
  })

  it('follows the weight bands rather than a flat figure', () => {
    expect(getReturnCostEstimate({ weight: 8 }).cost).toBe(29.99)
    expect(getReturnCostEstimate({ weight: 8.1 }).cost).toBe(34.99)
    expect(getReturnCostEstimate({ weight: 22 }).cost).toBe(44.99)
    expect(getReturnCostEstimate({ weight: 30 }).cost).toBe(54.99)
    // Past the relay cap it switches grids entirely, not just bands.
    expect(getReturnCostEstimate({ weight: 30.5 }).cost).toBe(109.99)
    expect(getReturnCostEstimate({ weight: 90 }).cost).toBe(149.99)
  })

  it('always tells the buyer the warehouse return is free', () => {
    const light = returnCostLines(getReturnCostEstimate(PARASOL))
    expect(light).toHaveLength(2)
    expect(light[1]).toBe('Retour gratuit si vous le rapportez à l’entrepôt.')

    // The bulky label already says it, in its own second sentence.
    const heavy = returnCostLines(getReturnCostEstimate(TONNELLE))
    expect(heavy).toHaveLength(1)
    expect(heavy.join(' ')).toMatch(/gratuitement à l’entrepôt/)
  })
})
