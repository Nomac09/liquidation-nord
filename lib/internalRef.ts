import crypto from 'crypto'

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no 0/O/1/I ambiguity

function hashTo(input: string, salt: string, length: number) {
  const hash = crypto.createHash('sha256').update(`${salt}:${input}`).digest()
  let out = ''
  for (let i = 0; i < length; i++) out += ALPHABET[hash[i] % ALPHABET.length]
  return out
}

// Customer-facing reference, e.g. "SQ-A3F91" — never the raw EAN.
export function generateInternalRef(id: string) {
  return `SQ-${hashTo(id, 'ref-salt-0', 5)}`
}

// Decorative 13-digit EAN-13-shaped code for the on-page barcode graphic,
// derived independently from the real EAN so it can't be reverse-mapped.
export function generatePseudoBarcode(id: string) {
  const hash = crypto.createHash('sha256').update(`barcode-salt:${id}`).digest()
  let digits = ''
  for (let i = 0; i < 12; i++) digits += hash[i] % 10
  let sum = 0
  for (let i = 0; i < 12; i++) sum += Number(digits[i]) * (i % 2 === 0 ? 1 : 3)
  const check = (10 - (sum % 10)) % 10
  return digits + String(check)
}
