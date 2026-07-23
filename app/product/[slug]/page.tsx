import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronRight } from 'lucide-react'
import connectDB from '@/lib/mongodb'
import Product from '@/lib/schemas/Product'
import ImageGallery from '@/components/ImageGallery'
import DeliveryToggle from '@/components/DeliveryToggle'
import AddToCart from '@/components/AddToCart'
import Sticker from '@/components/Sticker'
import Barcode from '@/components/Barcode'
import ConditionBadge from '@/components/ConditionBadge'
import { Reveal } from '@/components/motion'

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
  return {
    title: product.name.replace(/^vidaXL\s+/i, ''),
    description:
      product.description?.slice(0, 155) ||
      `${product.name} à ${product.salePrice} € au lieu de ${product.rrp} € — pièce unique, retrait gratuit à Bondues (59).`,
    openGraph: product.photos?.[0] ? { images: [product.photos[0]] } : undefined,
  }
}

const CATEGORY_LABELS: Record<string, string> = {
  Mobilier: 'Mobilier',
  Bazar: 'Bazar & Déco',
  Bricolage: 'Bricolage',
  Textile: 'Textile',
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

  const displayName = product.name.replace(/^vidaXL\s+/i, '')

  return (
    <div className="container mx-auto px-4 py-8">
      <nav aria-label="Fil d’Ariane" className="mb-6 flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-widest text-gris">
        <Link href="/" className="transition-colors hover:text-encre">
          Arrivage
        </Link>
        <ChevronRight aria-hidden className="h-3 w-3" />
        <Link href={`/?category=${product.category}`} className="transition-colors hover:text-encre">
          {CATEGORY_LABELS[product.category] || product.category}
        </Link>
      </nav>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        <div>
          <ImageGallery photos={product.photos} productName={displayName} />
        </div>

        <div className="space-y-6">
          <div>
            <p className="tag-label">Pièce unique</p>
            <h1 className="mt-2 font-display text-3xl font-bold leading-tight tracking-tight text-encre sm:text-4xl">
              {displayName}
            </h1>
          </div>

          <div className="rounded-xl border border-ligne bg-blanc p-6 shadow-carte">
            <Sticker price={product.salePrice} rrp={product.rrp} size="lg" tilted={false} />

            <ConditionBadge inspected={!!product.inspected} note={product.conditionNote} />

            <div className="mt-5">
              <AddToCart product={product} />
            </div>
          </div>

          {product.description && (
            <Reveal>
              <section aria-label="Description">
                <h2 className="tag-label">Description</h2>
                <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-encre/85">
                  {product.description.split(/\n{2,}/).map((p: string, i: number) =>
                    p.trim() ? <p key={i}>{p.trim()}</p> : null
                  )}
                </div>
              </section>
            </Reveal>
          )}

          <Reveal>
            <section
              aria-label="Fiche d’inventaire"
              className="rounded-xl border border-ligne bg-blanc p-6 shadow-carte"
            >
              <h2 className="tag-label">Fiche d’inventaire</h2>
              <dl className="mt-4 divide-y divide-ligne/70 font-mono text-sm">
                {[
                  ['Référence', product.sku],
                  ['Catégorie', CATEGORY_LABELS[product.category] || product.category],
                  ['État', product.inspected ? 'Comme neuf' : ''],
                  ['Dimensions', product.dimensions],
                  ['Poids', product.weight ? `${product.weight} kg` : ''],
                ]
                  .filter(([, v]) => v)
                  .map(([k, v]) => (
                    <div key={k as string} className="flex justify-between gap-4 py-2">
                      <dt className="text-gris">{k}</dt>
                      <dd className="text-right text-encre">{v}</dd>
                    </div>
                  ))}
              </dl>
              {product.specs?.length > 0 && (
                <ul className="mt-4 list-disc space-y-1 border-t border-ligne/70 pl-4 pt-4 text-sm text-encre/85">
                  {product.specs.map((s: string) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              )}
              <Barcode ean={product.ean} className="mt-6 text-encre/80" />
            </section>
          </Reveal>

          <Reveal>
            <section aria-label="Livraison" className="rounded-xl border border-ligne bg-blanc p-6 shadow-carte">
              <h2 className="tag-label">Comment je la récupère ?</h2>
              <div className="mt-4">
                <DeliveryToggle />
              </div>
              <p className="mt-3 text-xs leading-relaxed text-gris">
                Le mode de livraison se confirme au moment du paiement. Pour les
                gros meubles, le retrait à l’entrepôt reste le plus simple — on
                vous aide à charger.
              </p>
            </section>
          </Reveal>
        </div>
      </div>
    </div>
  )
}
