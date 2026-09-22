// TVA arithmetic for a TTC-priced catalogue.
//
// Every price in this shop is stored and displayed TTC: `salePrice` is
// what the customer pays, and the shipping bands in lib/shipping.ts are
// likewise the amount charged. Nothing here changes any of that. The job
// is only to split an amount the customer already agreed to into the HT
// and TVA parts a French invoice has to state.
//
// The one subtlety worth spelling out: rounding each line's HT to the
// cent and then summing those gives a total that will not, in general,
// equal the TTC total minus a separately-rounded TVA total. Off-by-a-cent
// invoices are the classic way an accounts payable department bounces a
// document. So the TVA figure is never computed independently: it is
// defined as totalTTC - totalHT, which makes HT + TVA = TTC an identity
// rather than something that happens to hold most of the time.

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
}

export interface VatBreakdown {
  lines: VatLine[]
  totalHT: number
  totalVat: number
  totalTTC: number
  rate: number
  rateLabel: string
}

/** HT for a single TTC amount, rounded to the cent. */
export function htFromTtc(ttc: number): number {
  return round2(ttc / (1 + VAT_RATE))
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
    ht: htFromTtc(l.ttc),
  }))

  const totalTTC = round2(lines.reduce((sum, l) => sum + l.ttc, 0))
  const totalHT = round2(lines.reduce((sum, l) => sum + l.ht, 0))
  // Deliberately the remainder, not round2(totalHT * VAT_RATE). See the
  // note at the top of this file.
  const totalVat = round2(totalTTC - totalHT)

  return { lines, totalHT, totalVat, totalTTC, rate: VAT_RATE, rateLabel: VAT_RATE_LABEL }
}

/** Invoice-style amount: always two decimals, French separators. "1 234,56 €" */
export function formatAmount(n: number): string {
  return `${n.toLocaleString('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} €`
}
