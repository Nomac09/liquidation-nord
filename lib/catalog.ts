import connectDB from '@/lib/mongodb'
import Product from '@/lib/schemas/Product'
import { buildSpecLine } from '@/lib/specs'

// Deliberately excludes `ean` — it's the raw manufacturer identifier and
// must never reach a customer-facing list or client component. `specs` is
// fetched here too, but only to derive `specLine` server-side — the raw
// array itself is stripped before the result leaves this module.
export const LIST_FIELDS = 'name internalRef category rrp salePrice photos condition slug lot status specs createdAt weight'

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function buildQuery(opts: {
  category?: string | null
  search?: string | null
  priceMin?: number | null
  priceMax?: number | null
  material?: string | null
  color?: string | null
}) {
  // A sold-out piece from the current arrival stays visible (struck
  // through in the UI) rather than vanishing — only genuinely hidden
  // stock (unsellable, e.g. the retired lot) is excluded here.
  const query: Record<string, unknown> = { status: { $in: ['sellable', 'sold'] } }
  if (opts.category) query.category = opts.category
  if (opts.search) {
    const rx = { $regex: escapeRegex(opts.search.trim()), $options: 'i' }
    query.$or = [{ name: rx }, { nameEn: rx }, { category: rx }, { sku: rx }]
  }
  if (opts.priceMin != null || opts.priceMax != null) {
    const range: Record<string, number> = {}
    if (opts.priceMin != null) range.$gte = opts.priceMin
    if (opts.priceMax != null) range.$lte = opts.priceMax
    query.salePrice = range
  }
  const specConditions: Record<string, unknown>[] = []
  if (opts.color) {
    specConditions.push({ $elemMatch: { $regex: `^couleur\\s*:.*${escapeRegex(opts.color)}`, $options: 'i' } })
  }
  if (opts.material) {
    specConditions.push({ $elemMatch: { $regex: `^matériau\\s*:.*${escapeRegex(opts.material)}`, $options: 'i' } })
  }
  if (specConditions.length > 0) query.specs = { $all: specConditions }
  return query
}

export async function getProducts(opts: {
  category?: string | null
  search?: string | null
  priceMin?: number | null
  priceMax?: number | null
  material?: string | null
  color?: string | null
  skip?: number
  limit?: number
}) {
  await connectDB()
  const query = buildQuery(opts)
  const limit = Math.min(opts.limit ?? 24, 100)
  const skip = Math.max(opts.skip ?? 0, 0)
  const [rawItems, total] = await Promise.all([
    Product.find(query)
      .select(LIST_FIELDS)
      .sort({ createdAt: -1, _id: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Product.countDocuments(query),
  ])
  const items = rawItems.map((p) => {
    const { specs, ...rest } = p as typeof p & { specs?: string[] }
    return { ...rest, specLine: buildSpecLine(rest.name, specs) }
  })
  return { items: JSON.parse(JSON.stringify(items)), total }
}

export async function getCategoryCounts() {
  await connectDB()
  // Nav proportions represent what's actually buyable right now, so sold
  // pieces (still shown, struck through, in the grid itself) don't count
  // toward the bar's weighting.
  const rows = await Product.aggregate([
    { $match: { status: 'sellable' } },
    { $group: { _id: '$category', n: { $sum: 1 } } },
  ])
  const counts: Record<string, number> = {}
  for (const r of rows) counts[r._id] = r.n
  return counts
}
