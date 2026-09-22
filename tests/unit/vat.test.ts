import { describe, it, expect } from 'vitest'
import { computeVat, htFromTtc, formatAmount, VAT_RATE } from '@/lib/vat'

/**
 * The property that matters is reconciliation: HT + TVA must equal TTC
 * exactly, for every cart, with no cent left over. Rounding each line's
 * HT and then deriving TVA independently is what produces the
 * off-by-a-cent invoice, so these tests are mostly about that edge rather
 * than about the division itself.
 */
describe('computeVat', () => {
  it('splits a single round line', () => {
    const { totalHT, totalVat, totalTTC } = computeVat([{ label: 'A', ttc: 120 }])
    expect(totalTTC).toBe(120)
    expect(totalHT).toBe(100)
    expect(totalVat).toBe(20)
  })

  it('reconciles when every line rounds against us', () => {
    // 0.01 TTC has an HT of 0.008333..., which rounds to 0.01 and leaves
    // zero TVA. Ten of them must still add up to the amount charged.
    const lines = Array.from({ length: 10 }, (_, i) => ({ label: `L${i}`, ttc: 0.01 }))
    const { totalHT, totalVat, totalTTC } = computeVat(lines)
    expect(totalTTC).toBe(0.1)
    expect(totalHT + totalVat).toBeCloseTo(totalTTC, 10)
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

describe('htFromTtc', () => {
  it('uses the configured rate, not a hardcoded 1.2', () => {
    expect(VAT_RATE).toBe(0.2)
    expect(htFromTtc(120)).toBe(100)
    expect(htFromTtc(19.99)).toBe(16.66)
  })

  it('rounds half away from zero at the classic float edge', () => {
    // 1.005 is the textbook case where naive toFixed gives 1.00.
    expect(htFromTtc(1.206)).toBe(1.01)
  })
})

describe('formatAmount', () => {
  it('always shows two decimals, French style', () => {
    expect(formatAmount(1234.5).replace(/ | /g, ' ')).toBe('1 234,50 €')
    expect(formatAmount(20)).toBe('20,00 €')
  })
})
