import { describe, it, expect } from 'vitest'
import { computeVat, htFromTtc, vatFromTtc, formatAmount, VAT_RATE } from '@/lib/vat'

/**
 * The property that matters is reconciliation: HT + TVA must equal TTC
 * exactly, for every cart, with no cent left over. Rounding more than one
 * of the three is what produces the off-by-a-cent invoice, so these tests
 * are mostly about that edge rather than about the division itself.
 *
 * The TVA is the rounded figure and the HT is the remainder, which is the
 * opposite of Phase 1. The two directions disagree by a cent on about one
 * amount in six, so `splits the TVA, not the HT` below is the test that
 * would catch a silent revert.
 */
describe('computeVat', () => {
  it('splits a single round line', () => {
    const { totalHT, totalVat, totalTTC } = computeVat([{ label: 'A', ttc: 120 }])
    expect(totalTTC).toBe(120)
    expect(totalHT).toBe(100)
    expect(totalVat).toBe(20)
  })

  it('reconciles when every line rounds against us', () => {
    // 0.01 TTC contains 0.001666... of TVA, which rounds to zero. Ten of
    // them must still add up to the amount charged.
    const lines = Array.from({ length: 10 }, (_, i) => ({ label: `L${i}`, ttc: 0.01 }))
    const { totalHT, totalVat, totalTTC } = computeVat(lines)
    expect(totalTTC).toBe(0.1)
    expect(totalHT + totalVat).toBeCloseTo(totalTTC, 10)
  })

  it('splits the TVA, not the HT', () => {
    // 12,09 € is one of the amounts where the two directions disagree:
    // rounding the HT gives 10,08 / 2,01, rounding the TVA gives
    // 10,07 / 2,02. The spec, and lib/vat.ts, round the TVA.
    const { totalHT, totalVat, totalTTC } = computeVat([{ label: 'A', ttc: 12.09 }])
    expect(totalTTC).toBe(12.09)
    expect(totalVat).toBe(2.02)
    expect(totalHT).toBe(10.07)
  })

  it('states one TVA figure for the order, not a sum of rounded lines', () => {
    // Three lines whose individual TVA each round up; the declared figure
    // is computed on the total, so it need not equal their sum.
    const { totalVat, totalTTC, lines } = computeVat([
      { label: 'A', ttc: 12.09 },
      { label: 'B', ttc: 12.09 },
      { label: 'C', ttc: 12.09 },
    ])
    expect(totalTTC).toBe(36.27)
    expect(totalVat).toBe(6.05)
    expect(lines.reduce((sum, l) => sum + l.vat, 0)).toBeCloseTo(6.06, 10)
  })

  it('reconciles on a realistic cart with shipping', () => {
    const { totalHT, totalVat, totalTTC } = computeVat([
      { label: 'Voile de parasol', ttc: 39.99 },
      { label: 'Oreiller extérieur lot de 4', ttc: 24.5 },
      { label: 'Livraison : Point relais', ttc: 34.99 },
    ])
    expect(totalTTC).toBe(99.48)
    expect(totalHT + totalVat).toBeCloseTo(totalTTC, 10)
    expect(totalVat).toBeGreaterThan(0)
  })

  it('reconciles across many awkward amounts', () => {
    const awkward = [0.03, 1.05, 7.77, 19.99, 33.33, 49.95, 99.99, 149.99, 0.99, 12.34]
    for (let size = 1; size <= awkward.length; size += 1) {
      const lines = awkward.slice(0, size).map((ttc, i) => ({ label: `L${i}`, ttc }))
      const { totalHT, totalVat, totalTTC } = computeVat(lines)
      expect(
        Math.round((totalHT + totalVat) * 100),
        `size ${size} did not reconcile`
      ).toBe(Math.round(totalTTC * 100))
    }
  })

  it('keeps every amount at a whole number of cents', () => {
    const { lines, totalHT, totalVat, totalTTC } = computeVat([
      { label: 'A', ttc: 19.99 },
      { label: 'B', ttc: 7.77 },
    ])
    const cents = [...lines.map((l) => l.ht), ...lines.map((l) => l.ttc), totalHT, totalVat, totalTTC]
    for (const value of cents) {
      expect(Math.abs(value * 100 - Math.round(value * 100))).toBeLessThan(1e-6)
    }
  })

  it('handles an empty cart without producing NaN', () => {
    const { totalHT, totalVat, totalTTC } = computeVat([])
    expect(totalTTC).toBe(0)
    expect(totalHT).toBe(0)
    expect(totalVat).toBe(0)
  })

  it('drops the shipping line when collection is free', () => {
    const { lines } = computeVat([{ label: 'Article', ttc: 50 }])
    expect(lines).toHaveLength(1)
  })
})

describe('vatFromTtc / htFromTtc', () => {
  it('uses the configured rate, not a hardcoded 1.2', () => {
    expect(VAT_RATE).toBe(0.2)
    expect(vatFromTtc(120)).toBe(20)
    expect(htFromTtc(120)).toBe(100)
    expect(vatFromTtc(19.99)).toBe(3.33)
    expect(htFromTtc(19.99)).toBe(16.66)
  })

  it('is exactly ttc / 6 at the standard rate', () => {
    for (const ttc of [0.01, 1.05, 12.09, 43.5, 99.99, 1234.56]) {
      expect(vatFromTtc(ttc)).toBe(Math.round((ttc / 6 + Number.EPSILON) * 100) / 100)
    }
  })

  it('always reconciles, whatever the amount', () => {
    for (const ttc of [0.01, 0.03, 0.09, 1.05, 12.09, 33.33, 43.5, 99.99, 149.99]) {
      expect(Math.round((vatFromTtc(ttc) + htFromTtc(ttc)) * 100)).toBe(Math.round(ttc * 100))
    }
  })

  it('rounds half away from zero at the classic float edge', () => {
    // 1.005 is the textbook case where naive toFixed gives 1.00.
    expect(vatFromTtc(6.03)).toBe(1.01)
  })
})

describe('formatAmount', () => {
  it('always shows two decimals, French style', () => {
    expect(formatAmount(1234.5).replace(/ | /g, ' ')).toBe('1 234,50 €')
    expect(formatAmount(20)).toBe('20,00 €')
  })
})
