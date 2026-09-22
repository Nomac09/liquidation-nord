import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import connectDB from '@/lib/mongodb'
import Product from '@/lib/schemas/Product'
import TicketRow from '@/components/TicketRow'
import { LIST_FIELDS } from '@/lib/catalog'
import { buildSpecLine } from '@/lib/specs'
import type { CatalogProduct } from '@/components/ProductCard'

/**
 * "Nos articles en stock": up to four of our own pieces from the
 * catalogue category this guide maps to.
 *
 * Sellable only, unlike the main grid, which keeps sold pieces visible
 * struck through. A struck-through row is meaningful in a list of "what
 * came in this week"; at the foot of an article it reads as a shop with
 * nothing left. If the category is empty the whole strip disappears
 * rather than rendering an empty shelf.
 */
export default async function GuideProductStrip({
  category,
  limit = 4,
}: {
  category: string
  limit?: number
}) {
  await connectDB()
  const raw = await Product.find({ category, status: 'sellable' })
    .select(LIST_FIELDS)
    .sort({ createdAt: -1, _id: 1 })
    .limit(limit)
    .lean()

  if (raw.length === 0) return null

  const items: CatalogProduct[] = JSON.parse(
    JSON.stringify(
      raw.map((p) => {
        const { specs, ...rest } = p as typeof p & { specs?: string[] }
        return { ...rest, specLine: buildSpecLine(rest.name as string, specs) }
      })
    )
  )

  return (
    <section className="mt-14 border-t border-hairline pt-10">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="font-display text-2xl tracking-tight text-ink">Nos articles en stock</h2>
        <Link
          href={`/?category=${encodeURIComponent(category)}`}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-verdigris-deep underline underline-offset-2 hover:text-ink"
        >
          Tout voir en {category}
          <ArrowRight aria-hidden className="h-3.5 w-3.5" />
        </Link>
      </div>

      <ul className="mt-5 flex flex-col gap-3 md:grid md:grid-cols-2 md:gap-4">
        {items.map((product) => (
          <li key={product._id}>
            <TicketRow product={product} />
          </li>
        ))}
      </ul>
    </section>
  )
}
