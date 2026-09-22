import { describe, it, expect } from 'vitest'
import {
  AGED_STOCK_BONUS,
  DISCOUNT_MAX,
  DISCOUNT_MIN,
  checkMarginFloor,
  clampDiscount,
  classifyCondition,
  decideDiscount,
  getComparisonDisplay,
  priceFromCompare,
  roundToPsych,
  stripeFee,
} from '@/lib/pricing'

describe('roundToPsych', () => {
  it('rounds down to the nearest ,90 or ,50', () => {
    // The spec's own example.
    expect(roundToPsych(43.72)).toBe(43.5)
    expect(roundToPsych(43.95)).toBe(43.9)
    expect(roundToPsych(43.5)).toBe(43.5)
    expect(roundToPsych(43.9)).toBe(43.9)
    // Below ,50 falls back to the previous whole euro's ,90.
    expect(roundToPsych(43.3)).toBe(42.9)
    expect(roundToPsych(43.0)).toBe(42.9)
  })

  it('never rounds up', () => {
    for (let cents = 50; cents <= 20000; cents += 7) {
      const value = cents / 100
      expect(roundToPsych(value), `${value}`).toBeLessThanOrEqual(value)
    }
  })

  it('only ever produces ,90 or ,50', () => {
    for (let cents = 50; cents <= 20000; cents += 13) {
      const rounded = Math.round(roundToPsych(cents / 100) * 100) % 100
      expect([90, 50]).toContain(rounded)
    }
  })

  it('floors at 0,50 € rather than going to zero or below', () => {
    expect(roundToPsych(0.4)).toBe(0.5)
    expect(roundToPsych(0)).toBe(0.5)
    expect(roundToPsych(-10)).toBe(0.5)
  })
})

describe('clampDiscount', () => {
  it('holds the 20..60 range', () => {
    expect(clampDiscount(5)).toBe(DISCOUNT_MIN)
    expect(clampDiscount(19)).toBe(20)
    expect(clampDiscount(40)).toBe(40)
    expect(clampDiscount(61)).toBe(DISCOUNT_MAX)
    expect(clampDiscount(200)).toBe(60)
  })

  it('returns whole points', () => {
    expect(clampDiscount(37.4)).toBe(37)
    expect(clampDiscount(37.6)).toBe(38)
  })
})

describe('classifyCondition', () => {
  it('reads the condition out of the free text', () => {
    expect(classifyCondition({ condition: "Neuf, emballage d'origine intact" })).toBe(
      'neuf-emballage-intact'
    )
    expect(classifyCondition({ condition: 'Neuf, emballage ouvert' })).toBe(
      'neuf-emballage-ouvert'
    )
    expect(classifyCondition({ condition: 'Open-box, complet' })).toBe('open-box-complet')
    expect(classifyCondition({ conditionNote: 'Légère rayure sur le côté' })).toBe(
      'defaut-signale'
    )
  })

  it('lets a reported defect win over the packaging', () => {
    // "Neuf, emballage ouvert, petite rayure" is a defect first: it is
    // the thing the buyer is being warned about.
    expect(
      classifyCondition({ condition: 'Neuf, emballage ouvert', conditionNote: 'petite rayure' })
    ).toBe('defaut-signale')
  })

  it('says it does not know rather than guessing', () => {
    expect(classifyCondition({})).toBe('inconnu')
    expect(classifyCondition({ condition: '', conditionNote: '' })).toBe('inconnu')
  })
})

describe('decideDiscount', () => {
  const now = new Date('2026-09-22T00:00:00.000Z')

  it('applies the grid', () => {
    const fresh = new Date('2026-09-01T00:00:00.000Z')
    expect(
      decideDiscount({ condition: "Neuf, emballage d'origine intact", createdAt: fresh }, { now })
        .discountPercent
    ).toBe(25)
    expect(
      decideDiscount({ condition: 'Neuf, emballage ouvert', createdAt: fresh }, { now })
        .discountPercent
    ).toBe(35)
    expect(
      decideDiscount({ condition: 'Open-box, complet', createdAt: fresh }, { now })
        .discountPercent
    ).toBe(40)
    expect(
      decideDiscount({ conditionNote: 'accessoire manquant', createdAt: fresh }, { now })
        .discountPercent
    ).toBe(50)
  })

  it('adds ten points to stock over 90 days old, and not to stock at 90', () => {
    const exactly90 = new Date('2026-06-24T00:00:00.000Z')
    const ninetyOne = new Date('2026-06-23T00:00:00.000Z')

    const at90 = decideDiscount({ condition: 'Open-box, complet', createdAt: exactly90 }, { now })
    expect(at90.agedDays).toBe(90)
    expect(at90.agedBonus).toBe(0)
    expect(at90.discountPercent).toBe(40)

    const at91 = decideDiscount({ condition: 'Open-box, complet', createdAt: ninetyOne }, { now })
    expect(at91.agedDays).toBe(91)
    expect(at91.agedBonus).toBe(AGED_STOCK_BONUS)
    expect(at91.discountPercent).toBe(50)
  })

  it('clamps the bonus at 60 rather than letting it run to 70', () => {
    const old = new Date('2025-01-01T00:00:00.000Z')
    const decision = decideDiscount({ conditionNote: 'défaut esthétique', createdAt: old }, { now })
    expect(decision.baseDiscount).toBe(50)
    expect(decision.agedBonus).toBe(10)
    expect(decision.discountPercent).toBe(60)
  })

  it('uses the fallback for an unknown condition and says so', () => {
    const decision = decideDiscount({ createdAt: now }, { now })
    expect(decision.conditionKey).toBe('inconnu')
    expect(decision.conditionLabel).toMatch(/présumé/)
    expect(decision.discountPercent).toBe(40)

    const conservative = decideDiscount(
      { createdAt: now },
      { now, fallbackCondition: 'neuf-emballage-intact' }
    )
    expect(conservative.discountPercent).toBe(25)
  })
})

describe('priceFromCompare', () => {
  it('discounts then rounds down to a psychological price', () => {
    // 72,87 € at 40 % is 43,72 €, which becomes 43,50 €.
    expect(priceFromCompare(72.87, 40)).toBe(43.5)
    expect(priceFromCompare(100, 25)).toBe(74.9)
    expect(priceFromCompare(100, 60)).toBe(39.9)
  })

  it('always lands at or below the exact discounted price', () => {
    for (const compare of [9.99, 49.9, 120, 349.95, 1299]) {
      for (const discount of [20, 25, 35, 40, 50, 60]) {
        const exact = compare * (1 - discount / 100)
        expect(priceFromCompare(compare, discount)).toBeLessThanOrEqual(exact + 1e-9)
      }
    }
  })
})

describe('checkMarginFloor', () => {
  it('passes when the sale covers the cost and the card fee', () => {
    // 60 € TTC = 50 € HT. Fee 1,5 % + 0,25 = 1,15 €. Cost 30 € TTC = 25 € HT.
    const check = checkMarginFloor(60, 30)
    expect(check.passes).toBe(true)
    expect(check.marginHT).toBeCloseTo(50 - 1.15 - 25, 2)
  })

  it('fails when it does not', () => {
    const check = checkMarginFloor(30, 40)
    expect(check.passes).toBe(false)
    expect(check.marginHT).toBeLessThan(0)
  })

  it('fails on the fee alone when cost equals price', () => {
    // Same price in and out: the Stripe fee is the whole of the loss.
    const check = checkMarginFloor(50, 50)
    expect(check.passes).toBe(false)
    expect(check.marginHT).toBeCloseTo(-stripeFee(50), 2)
  })

  it('treats an unknown cost as unknown, not as a failure', () => {
    expect(checkMarginFloor(10, undefined)).toEqual({ passes: true, marginHT: null })
    expect(checkMarginFloor(10, 0)).toEqual({ passes: true, marginHT: null })
    expect(checkMarginFloor(10, null)).toEqual({ passes: true, marginHT: null })
  })
})

describe('getComparisonDisplay', () => {
  const now = new Date('2026-09-22T00:00:00.000Z')
  const base = {
    price: 43.5,
    comparePrice: 72.87,
    comparePriceSource: 'vidaXL.fr',
    discountPercent: 40,
  }

  it('shows a dated, recent comparison', () => {
    const d = getComparisonDisplay(
      { ...base, comparePriceCheckedAt: new Date('2026-09-01T00:00:00.000Z') },
      now
    )
    expect(d.show).toBe(true)
    expect(d.checkedAtLabel).toBe('01/09/2026')
    expect(d.discountPercent).toBe(40)
  })

  it('hides an undated one', () => {
    expect(getComparisonDisplay({ ...base, comparePriceCheckedAt: null }, now)).toMatchObject({
      show: false,
      reason: 'no-date',
    })
  })

  it('hides one older than 90 days, and keeps 90 itself', () => {
    expect(
      getComparisonDisplay({ ...base, comparePriceCheckedAt: '2026-06-24T00:00:00.000Z' }, now).show
    ).toBe(true)
    expect(
      getComparisonDisplay({ ...base, comparePriceCheckedAt: '2026-06-23T00:00:00.000Z' }, now)
    ).toMatchObject({ show: false, reason: 'stale' })
  })

  it('hides one that is not actually cheaper elsewhere', () => {
    expect(
      getComparisonDisplay(
        { ...base, comparePrice: 40, comparePriceCheckedAt: '2026-09-01T00:00:00.000Z' },
        now
      )
    ).toMatchObject({ show: false, reason: 'not-cheaper' })
  })

  it('hides when there is nothing to compare with', () => {
    expect(getComparisonDisplay({ price: 43.5 }, now)).toMatchObject({
      show: false,
      reason: 'no-compare-price',
    })
  })
})
