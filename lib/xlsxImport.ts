// What a row of the supplier XLSX sheet is allowed to write to a product.
//
// The sheet only ever carries EAN/SKU/Name/Category/RRP/Quantity, plus —
// on some sheets — Weight/Condition/Photos/Dimensions. A re-import must
// never wipe a field the current sheet doesn't carry: weight and photos
// are filled in later by hand, after the sheet already ran once, and a
// column simply not being on this particular sheet is not the same thing
// as "set it back to empty."
//
// Pricing is a separate, more absolute rule: the importer must never
// touch salePrice, discountPercent or comparePrice* on an existing
// product at all, sheet or no sheet — see docs on the pricing decision.
// It still picks a starting price for a genuinely new product, because a
// new row has no "current price" to preserve.

export interface ParsedProductRow {
  ean: string
  sku: string
  name: string
  category: string
  rrp: number
  quantity: number
  weight: number | null
  photos: string[] | null
  condition: string | null
  dimensions: string | null
}

function toNumber(value: unknown): number | null {
  const n = parseFloat(String(value ?? '').trim().replace(',', '.'))
  return Number.isFinite(n) ? n : null
}

function cell(row: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const v = row[key]
    if (v !== undefined && v !== null && String(v).trim() !== '') return String(v).trim()
  }
  return ''
}

/** Null when the row has no usable name/EAN — the caller should skip it. */
export function parseProductRow(row: Record<string, unknown>): ParsedProductRow | null {
  let ean = cell(row, 'EAN')
  const name = cell(row, 'Name')
  const category = cell(row, 'Category') || 'Bazar'
  const rrp = toNumber(row['RRP']) ?? 0
  const quantity = parseInt(cell(row, 'Quantity') || '1', 10) || 1

  // Excel turns a long numeric EAN into scientific notation on its own.
  if (ean.includes('E+')) {
    const num = Number(ean)
    if (!isNaN(num)) ean = String(Math.round(num))
  }

  if (!name || !ean || ean === '0') return null

  const weight = toNumber(row['Weight'] ?? row['Poids'])
  const condition = cell(row, 'Condition', 'État', 'Etat') || null
  const dimensions = cell(row, 'Dimensions') || null
  const photosRaw = cell(row, 'Photos', 'Photo')
  const photos = photosRaw
    ? photosRaw
        .split(/[,;]+/)
        .map((s) => s.trim())
        .filter(Boolean)
    : null

  return {
    ean,
    sku: cell(row, 'SKU'),
    name,
    category,
    rrp,
    quantity,
    weight: weight && weight > 0 ? weight : null,
    photos: photos && photos.length > 0 ? photos : null,
    condition,
    dimensions,
  }
}

/**
 * The flat 40 %/50 % starting discount off RRP. Only ever used to give a
 * brand-new article an initial price — never applied to an existing one,
 * per the pricing decision to keep all current prices unless a human runs
 * a repricing pass on purpose.
 */
export function initialSalePrice(rrp: number): number {
  return Math.round(rrp * (rrp > 500 ? 0.4 : 0.5))
}

/**
 * Fields to $set on a product that already exists.
 *
 * Deliberately excludes weight, photos, condition and dimensions unless
 * this row actually supplies a real value for them, and never includes
 * salePrice, discountPercent or comparePrice* at all — those are not the
 * importer's to set once a product exists.
 */
export function buildUpdatePatch(row: ParsedProductRow, slug: string): Record<string, unknown> {
  const set: Record<string, unknown> = {
    sku: row.sku,
    name: row.name,
    category: row.category,
    rrp: row.rrp,
    quantity: row.quantity,
    slug,
  }
  if (row.weight !== null) set.weight = row.weight
  if (row.photos !== null) set.photos = row.photos
  if (row.condition !== null) set.condition = row.condition
  if (row.dimensions !== null) set.dimensions = row.dimensions
  return set
}

/** Fields for a product that does not exist yet. */
export function buildCreateDoc(row: ParsedProductRow, slug: string): Record<string, unknown> {
  return {
    ean: row.ean,
    sku: row.sku,
    name: row.name,
    category: row.category,
    rrp: row.rrp,
    quantity: row.quantity,
    photos: row.photos ?? [],
    status: 'sellable' as const,
    condition: row.condition ?? '',
    inspected: false,
    dimensions: row.dimensions ?? '',
    weight: row.weight ?? 0,
    slug,
    salePrice: initialSalePrice(row.rrp),
  }
}
