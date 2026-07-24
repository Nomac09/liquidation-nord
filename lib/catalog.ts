import connectDB from '@/lib/mongodb'
import Product from '@/lib/schemas/Product'

// Deliberately excludes `ean` — it's the raw manufacturer identifier and
// must never reach a customer-facing list or client component.
export const LIST_FIELDS = 'name internalRef category rrp salePrice photos condition slug lot createdAt'

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function buildQuery(category?: string | null, search?: string | null) {
  const query: Record<string, unknown> = { status: 'sellable' }
  if (category) query.category = category
  if (search) {
    const rx = { $regex: escapeRegex(search.trim()), $options: 'i' }
    query.$or = [{ name: rx }, { nameEn: rx }, { category: rx }, { sku: rx }]
  }
  return query
}

export async function getProducts(opts: {
  category?: string | null
  search?: string | null
  skip?: number
  limit?: number
}) {
  await connectDB()
  const query = buildQuery(opts.category, opts.search)
  const limit = Math.min(opts.limit ?? 24, 100)
  const skip = Math.max(opts.skip ?? 0, 0)
  const [items, total] = await Promise.all([
    Product.find(query)
      .select(LIST_FIELDS)
      .sort({ createdAt: -1, _id: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Product.countDocuments(query),
  ])
  return { items: JSON.parse(JSON.stringify(items)), total }
}

export async function getCategoryCounts() {
  await connectDB()
  const rows = await Product.aggregate([
    { $match: { status: 'sellable' } },
    { $group: { _id: '$category', n: { $sum: 1 } } },
  ])
  const counts: Record<string, number> = {}
  for (const r of rows) counts[r._id] = r.n
  return counts
}
