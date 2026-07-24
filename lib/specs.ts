// Extracts a short "dimensions · matière" line from a product's raw
// specs array (and, for dimensions, the name itself — many titles already
// carry them, e.g. "200x100x75 cm"). Computed server-side only: specs
// arrays are 10+ lines long and must never be shipped whole to a client
// component just to derive one summary line.
const DIM_IN_NAME = /\d+([.,]\d+)?\s*x\s*\d+([.,]\d+)?(\s*x\s*\d+([.,]\d+)?)?\s*(cm|m)\b/i

function extractDimensions(name: string, specs: string[]): string | null {
  const fromName = name.match(DIM_IN_NAME)
  if (fromName) return fromName[0]
  const line = specs.find((s) => /^(dimensions?|taille)\s*:/i.test(s.trim()))
  return line ? line.replace(/^(dimensions?|taille)[^:]*:\s*/i, '').trim() : null
}

function extractMaterial(specs: string[]): string | null {
  const line = specs.find((s) => /^matériau\s*:/i.test(s.trim()))
  if (!line) return null
  const val = line.replace(/^matériau\s*:\s*/i, '').trim()
  // Keep it short — a card line, not the full spec sentence.
  return val.length > 28 ? val.slice(0, 28).trim() + '…' : val
}

export function buildSpecLine(name: string, specs?: string[]): string {
  const list = Array.isArray(specs) ? specs : []
  const dim = extractDimensions(name, list)
  const mat = extractMaterial(list)
  if (dim && mat) return `${dim} · ${mat}`
  return dim || mat || ''
}
