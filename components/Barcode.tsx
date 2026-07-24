// Renders a valid-format EAN-13 barcode as an inline SVG, purely as a
// design element on the spec card. `code` is a decorative pseudo-EAN
// (never the product's real manufacturer EAN); `displayText` overrides
// what prints underneath — normally the customer-facing reference.
const L = ['0001101', '0011001', '0010011', '0111101', '0100011', '0110001', '0101111', '0111011', '0110111', '0001011']
const G = ['0100111', '0110011', '0011011', '0100001', '0011101', '0111001', '0000101', '0010001', '0001001', '0010111']
const R = ['1110010', '1100110', '1101100', '1000010', '1011100', '1001110', '1010000', '1000100', '1001000', '1110100']
const PARITY = ['LLLLLL', 'LLGLGG', 'LLGGLG', 'LLGGGL', 'LGLLGG', 'LGGLLG', 'LGGGLL', 'LGLGLG', 'LGLGGL', 'LGGLGL']

function encode(ean: string): string | null {
  if (!/^\d{13}$/.test(ean)) return null
  const first = Number(ean[0])
  const parity = PARITY[first]
  let bits = '101'
  for (let i = 1; i <= 6; i++) {
    const d = Number(ean[i])
    bits += parity[i - 1] === 'L' ? L[d] : G[d]
  }
  bits += '01010'
  for (let i = 7; i <= 12; i++) {
    bits += R[Number(ean[i])]
  }
  bits += '101'
  return bits
}

export default function Barcode({
  code,
  displayText,
  className,
}: {
  code: string
  displayText?: string
  className?: string
}) {
  const bits = encode(code)
  if (!bits) return null

  const bars: { x: number; w: number }[] = []
  let run = 0
  for (let i = 0; i <= bits.length; i++) {
    if (bits[i] === '1') {
      run++
    } else if (run > 0) {
      bars.push({ x: i - run, w: run })
      run = 0
    }
  }

  return (
    <div className={className}>
      <svg
        viewBox={`0 0 ${bits.length} 36`}
        preserveAspectRatio="none"
        className="h-9 w-full"
        role="img"
        aria-label={`Code-barres ${displayText || code}`}
      >
        {bars.map((b, i) => (
          <rect key={i} x={b.x} y={0} width={b.w} height={36} fill="currentColor" />
        ))}
      </svg>
      <p className="mt-1 text-center font-mono text-[11px] tracking-[0.35em] text-current">
        {displayText || code}
      </p>
    </div>
  )
}
