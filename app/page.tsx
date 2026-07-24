import DropModule from '@/components/DropModule'
import ProductGrid from '@/components/ProductGrid'
import { getProducts } from '@/lib/catalog'
import { getDropInfo } from '@/lib/drop'
import { CATEGORY_LABELS } from '@/lib/categories'

export const dynamic = 'force-dynamic'

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{
    category?: string
    search?: string
    priceMin?: string
    priceMax?: string
    material?: string
    color?: string
  }>
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
        <DropModule
          dateLabel={drop.dateLabel}
          remaining={drop.remaining}
          total={drop.total}
          brand={drop.brand}
          photos={drop.photos}
        />
      )}

      <section className="container mx-auto px-4 py-10">
        <div className="mb-6">
          <h2 className="font-display text-2xl font-bold tracking-tight text-encre">
            {search
              ? `Résultats pour « ${search} »`
              : category
                ? CATEGORY_LABELS[category] || category
                : 'Tout l’arrivage'}
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
