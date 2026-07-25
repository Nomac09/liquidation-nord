import type { MetadataRoute } from 'next'
import connectDB from '@/lib/mongodb'
import Product from '@/lib/schemas/Product'
import { CATEGORIES } from '@/lib/categories'

const SITE_URL = 'https://www.souqify.fr'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connectDB()

  // Only 'sellable' pieces have a live page — once sold, /product/[slug]
  // 404s (the struck-through grid listing is the only place a sold piece
  // still shows), so a sitemap entry for anything else would be a dead link.
  const products = await Product.find({ status: 'sellable' })
    .select('slug updatedAt')
    .lean()

  const productEntries: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${SITE_URL}/product/${p.slug}`,
    lastModified: p.updatedAt ? new Date(p.updatedAt) : undefined,
    changeFrequency: 'daily',
    priority: 0.7,
  }))

  const categoryEntries: MetadataRoute.Sitemap = CATEGORIES.map((c) => ({
    url: `${SITE_URL}/?category=${encodeURIComponent(c.value)}`,
    changeFrequency: 'daily',
    priority: 0.6,
  }))

  return [
    { url: SITE_URL, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/cgv`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${SITE_URL}/politique-cookies`, changeFrequency: 'yearly', priority: 0.2 },
    ...categoryEntries,
    ...productEntries,
  ]
}
