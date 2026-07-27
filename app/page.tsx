import type { Metadata } from 'next'
import CollectionHero from '@/components/CollectionHero'
import ProductGrid from '@/components/ProductGrid'
import { getProducts } from '@/lib/catalog'
import { getDropInfo } from '@/lib/drop'
import { CATEGORY_LABELS } from '@/lib/categories'

export const dynamic = 'force-dynamic'

type HomeSearchParams = {
  category?: string
  search?: string
  priceMin?: string
  priceMax?: string
  material?: string
  color?: string
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<HomeSearchParams>
}): Promise<Metadata> {
  const { category, search, priceMin, priceMax, material, color } = await searchParams

  // Free-text search and facet filters (price/material/color) produce
  // near-infinite thin/duplicate variations of the same listing — not
  // worth indexing. The 5 fixed categories are stable, worthwhile pages.
  const isFacetFiltered = Boolean(search || priceMin || priceMax || material || color)

  if (category && CATEGORY_LABELS[category]) {
    const label = CATEGORY_LABELS[category]
    return {
      title: `${label} — vidaXL à −50 %`,
      description: `${label} vidaXL à Bondues (59), à moitié prix. Chaque pièce est en stock limité — retrait gratuit ou livraison partout en France.`,
      // No `alternates.canonical` here: Next's URL resolver collapses any
      // root-path URL ("/") down to the bare origin, silently dropping
      // the ?category= query string — a canonical that would wrongly
      // point every category page back at the plain homepage. Omitting
      // it lets each category's own crawled URL self-canonicalize.
      robots: isFacetFiltered ? { index: false, follow: true } : undefined,
    }
  }

  return {
    alternates: { canonical: '/' },
    robots: isFacetFiltered ? { index: false, follow: true } : undefined,
  }
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<HomeSearchParams>
}) {
  const params = await searchParams
  const { category, search, priceMin, priceMax, material, color } = params

  const showDrop = !category && !search && !priceMin && !priceMax && !material && !color

  const [{ items, total }, drop] = await Promise.all([
    getProducts({
      category,
      search,
      priceMin: priceMin ? Number(priceMin) : null,
      priceMax: priceMax ? Number(priceMax) : null,
      material,
      color,
      limit: 24,
    }),
    showDrop ? getDropInfo() : Promise.resolve(null),
  ])

  return (
    <div>
      {showDrop && drop && (
        <CollectionHero brand={drop.brand} photos={drop.photos} />
      )}

      <section className="container mx-auto px-4 py-10">
        <div className="mb-6">
          <h2 className="font-display text-2xl font-bold tracking-tight text-encre">
            {search
              ? `Résultats pour « ${search} »`
              : category
                ? CATEGORY_LABELS[category] || category
                : 'Toute la collection'}
          </h2>
        </div>

        <ProductGrid
          key={`${category || ''}|${search || ''}|${priceMin || ''}|${priceMax || ''}|${material || ''}|${color || ''}`}
          initialItems={items}
          total={total}
          category={category}
          search={search}
          priceMin={priceMin}
          priceMax={priceMax}
          material={material}
          color={color}
        />
      </section>
    </div>
  )
}
