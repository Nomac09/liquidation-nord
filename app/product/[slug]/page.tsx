import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronRight } from 'lucide-react'
import connectDB from '@/lib/mongodb'
import Product from '@/lib/schemas/Product'
import ImageGallery from '@/components/ImageGallery'
import AddToCart from '@/components/AddToCart'
import FavoriteButton from '@/components/FavoriteButton'
import PriceMark from '@/components/PriceMark'
import ConditionBadge from '@/components/ConditionBadge'
import { Reveal } from '@/components/motion'
import { CATEGORY_LABELS } from '@/lib/categories'
import { BRAND_NAME } from '@/lib/brand'

export const dynamic = 'force-dynamic'

async function getProduct(slug: string) {
  await connectDB()
  const product = await Product.findOne({ slug, status: 'sellable' }).lean()
  return product ? JSON.parse(JSON.stringify(product)) : null
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const product = await getProduct(slug)
  if (!product) return {}
  const description =
    product.description?.slice(0, 155) ||
    `${product.name} à ${product.salePrice} € au lieu de ${product.rrp} € — retrait gratuit à Bondues (59) ou livraison partout en France.`
  return {
    title: product.name,
    description,
    alternates: { canonical: `/product/${product.slug}` },
    // A per-route `openGraph` object fully replaces the root layout's
    // (Next doesn't deep-merge it) — type/locale/siteName must be
    // repeated here or they silently disappear from this page's tags.
    openGraph: {
      type: 'website',
      locale: 'fr_FR',
      siteName: BRAND_NAME,
      images: product.photos?.[0] ? [product.photos[0]] : undefined,
    },
    twitter: product.photos?.[0] ? { card: 'summary_large_image' } : undefined,
  }
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const product = await getProduct(slug)

  if (!product) {
    notFound()
  }

  // Liquidation/returns stock, never sold as brand-new — UsedCondition is
  // the honest read regardless of the "Comme neuf" inspection badge above,
  // which is a condition note, not a new-in-box claim (see ConditionBadge).
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description:
      product.description?.slice(0, 500) ||
      `${product.name} — retrait gratuit à Bondues (59) ou livraison partout en France.`,
    image: product.photos || [],
    sku: product.internalRef || undefined,
    category: CATEGORY_LABELS[product.category] || product.category,
    offers: {
      '@type': 'Offer',
      url: `https://www.souqify.fr/product/${product.slug}`,
      priceCurrency: 'EUR',
      price: product.salePrice,
      itemCondition: 'https://schema.org/UsedCondition',
      availability: 'https://schema.org/InStock',
    },
  }

  const specRows = [
    ['Référence', product.internalRef],
    ['Catégorie', CATEGORY_LABELS[product.category] || product.category],
    ['État', product.inspected ? 'Comme neuf' : ''],
    ['Dimensions', product.dimensions],
    ['Poids', product.weight ? `${product.weight} kg` : ''],
  ].filter(([, v]) => v)

  return (
    <div className="bg-stone">
      <div className="container mx-auto px-4 py-10 sm:py-14">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <nav aria-label="Fil d’Ariane" className="mb-8 flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-widest text-dust">
          <Link href="/" className="transition-colors hover:text-ink">
            Catalogue
          </Link>
          <ChevronRight aria-hidden className="h-3 w-3" />
          <Link href={`/?category=${product.category}`} className="transition-colors hover:text-ink">
            {CATEGORY_LABELS[product.category] || product.category}
          </Link>
        </nav>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
          <div>
            <ImageGallery photos={product.photos} productName={product.name} />
          </div>

          <div>
            <div className="flex items-start justify-between gap-4">
              <div>
                {product.internalRef && (
                  <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-dust">
                    Réf. {product.internalRef}
                  </p>
                )}
                <h1 className="mt-2 font-serif text-3xl leading-[1.15] text-ink sm:text-4xl" style={{ textWrap: 'balance' }}>
                  {product.name}
                </h1>
              </div>
              <FavoriteButton
                productId={product._id}
                productName={product.name}
                className="mt-1 shrink-0"
              />
            </div>

            <div className="mt-6 border-b border-hairline pb-6">
              <PriceMark price={product.salePrice} rrp={product.rrp} size="lg" />
            </div>

            <ConditionBadge inspected={!!product.inspected} note={product.conditionNote} />

            <div className="mt-6">
              <AddToCart
                productId={product._id}
                name={product.name}
                price={product.salePrice}
                photo={product.photos?.[0]}
                weight={product.weight}
              />
            </div>

            {product.description && (
              <Reveal>
                <section aria-label="Description" className="mt-10 border-t border-hairline pt-8">
                  <h2 className="font-mono text-[11px] uppercase tracking-[0.14em] text-dust">Description</h2>
                  <div className="mt-3 space-y-3 font-karla text-[15px] leading-relaxed text-ink/85">
                    {product.description.split(/\n{2,}/).map((p: string, i: number) =>
                      p.trim() ? <p key={i}>{p.trim()}</p> : null
                    )}
                  </div>
                </section>
              </Reveal>
            )}

            <Reveal>
              <section aria-label="Fiche d’inventaire" className="mt-10 border-t border-hairline pt-8">
                <h2 className="font-mono text-[11px] uppercase tracking-[0.14em] text-dust">Fiche d’inventaire</h2>
                <dl className="mt-3 font-mono text-[13px]">
                  {specRows.map(([k, v]) => (
                    <div key={k as string} className="flex justify-between gap-4 border-t border-hairline py-2.5 first:border-t-0">
                      <dt className="text-dust">{k}</dt>
                      <dd className="text-right text-ink">{v}</dd>
                    </div>
                  ))}
                </dl>
                {product.specs?.length > 0 && (
                  <ul className="mt-4 list-disc space-y-1 border-t border-hairline pl-4 pt-4 font-karla text-sm text-ink/85">
                    {product.specs.map((s: string) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                )}
              </section>
            </Reveal>
          </div>
        </div>
      </div>
    </div>
  )
}
