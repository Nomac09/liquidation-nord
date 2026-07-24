import connectDB from '@/lib/mongodb'
import Product from '@/lib/schemas/Product'

const CURRENT_LOT = '21264'

// The current arrival, as a real, queryable fact rather than marketing
// copy: when it actually entered the catalog, how many pieces remain
// right now, and a handful of real photos from it. Nothing here is
// invented — the date is the genuine import timestamp, not a campaign name.
export async function getDropInfo() {
  await connectDB()

  const [dateAgg, remaining, total, brandAgg, photoSample] = await Promise.all([
    Product.aggregate([
      { $match: { lot: CURRENT_LOT } },
      { $group: { _id: null, min: { $min: '$createdAt' } } },
    ]),
    Product.countDocuments({ lot: CURRENT_LOT, status: 'sellable' }),
    Product.countDocuments({ lot: CURRENT_LOT, status: { $in: ['sellable', 'sold'] } }),
    Product.aggregate([
      { $match: { lot: CURRENT_LOT, status: 'sellable' } },
      { $match: { name: { $regex: '^vidaxl', $options: 'i' } } },
      { $count: 'n' },
    ]),
    Product.aggregate([
      { $match: { lot: CURRENT_LOT, status: 'sellable', 'photos.0': { $exists: true } } },
      { $sample: { size: 16 } },
      { $project: { photo: { $arrayElemAt: ['$photos', 0] }, name: 1 } },
    ]),
  ])

  const date: Date | null = dateAgg[0]?.min ? new Date(dateAgg[0].min) : null
  const brandCount = brandAgg[0]?.n || 0
  // Dynamic, not hardcoded: only claim the vidaXL name when it's genuinely
  // the dominant brand in this arrival.
  const brand = remaining > 0 && brandCount / remaining > 0.5 ? 'vidaXL' : null

  return {
    dateLabel: date
      ? date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
      : null,
    remaining,
    total,
    brand,
    photos: photoSample.map((p: { photo: string; name: string }) => ({ url: p.photo, name: p.name })),
  }
}
