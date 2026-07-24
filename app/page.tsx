import Hero from '@/components/Hero'
import ProductGrid from '@/components/ProductGrid'
import { Reveal } from '@/components/motion'
import { getCategoryCounts, getProducts } from '@/lib/catalog'
import { MapPin, Search as SearchIcon, Timer } from 'lucide-react'

export const dynamic = 'force-dynamic'

const CATEGORY_LABELS: Record<string, string> = {
  Mobilier: 'Mobilier',
  Bazar: 'Bazar & Déco',
  Bricolage: 'Bricolage',
  Textile: 'Textile',
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; search?: string }>
}) {
  const params = await searchParams
  const category = params.category
  const search = params.search

  const [{ items, total }, counts] = await Promise.all([
    getProducts({ category, search, limit: 24 }),
    getCategoryCounts(),
  ])

  const showHero = !category && !search

  return (
    <div>
      {showHero && (
        <>
          <Hero counts={counts} />

          <section aria-label="Comment ça marche" className="border-b border-ligne bg-beton">
            <div className="container mx-auto grid gap-px overflow-hidden px-4 py-0 sm:grid-cols-3">
              {[
                {
                  icon: SearchIcon,
                  title: 'Repérez votre pièce',
                  text: 'Parcourez l’arrivage en cours — mobilier, jardin, bricolage, déco.',
                },
                {
                  icon: Timer,
                  title: 'Payez sans attendre',
                  text: 'Un seul exemplaire de chaque — le premier paiement confirmé l’emporte.',
                },
                {
                  icon: MapPin,
                  title: 'Récupérez ou faites livrer',
                  text: 'Retrait gratuit à Bondues, point relais ou livraison à domicile.',
                },
              ].map((step, i) => (
                <Reveal key={step.title} delay={i * 0.08} className="flex gap-4 py-6 sm:px-4 sm:first:pl-0">
                  <step.icon aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-bleu" />
                  <div>
                    <h2 className="font-display text-base font-semibold text-encre">
                      {step.title}
                    </h2>
                    <p className="mt-1 text-sm leading-relaxed text-gris">{step.text}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </section>
        </>
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
          key={`${category || ''}|${search || ''}`}
          initialItems={items}
          total={total}
          category={category}
          search={search}
        />
      </section>
    </div>
  )
}
