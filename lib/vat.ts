// TVA arithmetic for a TTC-priced catalogue.
//
// Every price in this shop is stored and displayed TTC: `salePrice` is
// what the customer pays, and the shipping bands in lib/shipping.ts are
// likewise the amount charged. Nothing here changes any of that. The job
// is only to split an amount the customer already agreed to into the HT
// and TVA parts a French invoice has to state.
//
// The one subtlety worth spelling out: rounding each part independently
// gives a total that will not, in general, reconcile. Off-by-a-cent
// invoices are the classic way an accounts payable department bounces a
// document. So exactly one of the three numbers is rounded, and the
// others fall out of it:
//
//   vatAmount = round(ttc / 6)      i.e. round(ttc * rate / (1 + rate))
//   amountHT  = ttc - vatAmount
//
// which makes HT + TVA = TTC an identity rather than something that
// happens to hold most of the time. The rounded one is the TVA, not the
// HT, because the TVA is the figure that gets declared: it is the one
// that should be computed rather than inferred. (Phase 1 rounded the HT
// instead. The two disagree by a cent on roughly one amount in six —
// 12,09 € splits as 2,01 € one way and 2,02 € the other — so the
// direction is a decision, not a detail.)

import { COMPANY } from '@/lib/company'

export const VAT_RATE = COMPANY.vat.standardRate

/** "20 %", derived so the copy can never drift from the rate used. */
export const VAT_RATE_LABEL = `${Math.round(VAT_RATE * 100)} %`

function round2(n: number): number {
  // Scale-and-round rather than toFixed: toFixed returns a string and
  // rounds half-to-even on some values, which is not what an invoice
  // wants. EPSILON nudges the classic 1.005 -> 1.00 float case.
  return Math.round((n + Number.EPSILON) * 100) / 100
}

export interface VatLineInput {
  label: string
  /** TTC amount for the whole line, quantity already applied. */
  ttc: number
}

export interface VatLine extends VatLineInput {
  ht: number
  vat: number
}

export interface VatBreakdown {
  lines: VatLine[]
  totalHT: number
  totalVat: number
  totalTTC: number
  rate: number
  rateLabel: string
}

/** The TVA contained in a TTC amount. At 20 %, this is ttc / 6. */
export function vatFromTtc(ttc: number): number {
  return round2((ttc * VAT_RATE) / (1 + VAT_RATE))
}

/** HT for a single TTC amount. Always exactly ttc - vatFromTtc(ttc). */
export function htFromTtc(ttc: number): number {
  return round2(ttc - vatFromTtc(ttc))
}

/**
 * Split a set of TTC lines into HT / TVA / TTC.
 *
 * Guarantees, for any input: `totalHT + totalVat === totalTTC` exactly,
 * and every amount is a whole number of cents.
 */
export function computeVat(inputs: VatLineInput[]): VatBreakdown {
  const lines: VatLine[] = inputs.map((l) => ({
    ...l,
    ttc: round2(l.ttc),
    vat: vatFromTtc(l.ttc),
    ht: htFromTtc(l.ttc),
  }))

  const totalTTC = round2(lines.reduce((sum, l) => sum + l.ttc, 0))
  // Computed on the total, not summed from the lines: a French invoice
  // declares one TVA figure per rate, and summing rounded line amounts
  // would make it disagree with that figure by a cent or two. The lines
  // are the breakdown; this is the number.
  const totalVat = vatFromTtc(totalTTC)
  const totalHT = round2(totalTTC - totalVat)

  return { lines, totalHT, totalVat, totalTTC, rate: VAT_RATE, rateLabel: VAT_RATE_LABEL }
}

/** Invoice-style amount: always two decimals, French separators. "1 234,56 €" */
export function formatAmount(n: number): string {
  return `${n.toLocaleString('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} €`
}
