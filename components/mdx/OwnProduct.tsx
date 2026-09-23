import Image from 'next/image'
import Link from 'next/link'
import mongoose from 'mongoose'
import { ArrowRight, ImageOff } from 'lucide-react'
import connectDB from '@/lib/mongodb'
import Product from '@/lib/schemas/Product'
import { formatPrice } from '@/components/Sticker'

/**
 * One of our own pieces, embedded in a guide.
 *
 * `id` is whatever is easiest to write by hand in MDX: a Mongo _id, the
 * customer-facing internalRef ("SQ-A3F91"), or the slug. Requiring an
 * ObjectId would mean copying a 24-character hex string into prose, which
 * is how the wrong product ends up in an article.
 *
 * A sold piece never renders as a dead card. /product/[slug] 404s for
 * anything not 'sellable', so linking one would send a reader from an
 * article we asked them to trust straight into a not-found page; it
 * degrades to an honest "vendu" pointing at the category instead.
 */
async function findProduct(id: string) {
  await connectDB()
  const or: Record<string, unknown>[] = [{ internalRef: id }, { slug: id }]
  if (mongoose.Types.ObjectId.isValid(id)) or.unshift({ _id: id })

  const product = await Product.findOne({ $or: or })
    .select('name slug salePrice rrp photos category status conditionNote inspected')
    .lean()
  return product ? JSON.parse(JSON.stringify(product)) : null
}

export default async function OwnProduct({ id }: { id: string }) {
  const product = await findProduct(id)

  if (!product) {
    // Visible in development, invisible to readers: a missing id is an
    // editing mistake, and silently rendering nothing hides it until
    // someone notices the article is short.
    if (process.env.NODE_ENV !== 'production') {
      return (
        <div className="my-6 rounded-lg border-2 border-dashed border-alert bg-alert-pale px-5 py-4 text-sm text-alert">
          &lt;OwnProduct id=&quot;{id}&quot; /&gt; : aucun produit trouvé pour cet identifiant.
        </div>
      )
    }
    return null
  }

  const photo = (product.photos as string[] | undefined)?.filter(Boolean)[0]
  const sold = product.status !== 'sellable'
  const categoryHref = `/?category=${encodeURIComponent(product.category)}`

  return (
    <div className="my-6 overflow-hidden rounded-xl border border-hairline bg-surface shadow-carte">
      <div className="flex flex-col gap-4 p-5 sm:flex-row">
        <div className="relative h-36 w-full shrink-0 overflow-hidden rounded-lg bg-paper sm:h-32 sm:w-32">
          {photo ? (
            <Image
              src={photo}
              alt={product.name}
              fill
              className={`object-cover ${sold ? 'opacity-50 grayscale' : ''}`}
              sizes="128px"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <ImageOff aria-hidden className="h-5 w-5 text-dust" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="inline-flex items-center rounded-full bg-verdigris px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-stone">
            Vendu et expédié par Souqify
          </p>

          <h3 className="mt-2.5 font-display text-lg leading-snug text-ink">{product.name}</h3>

          {product.conditionNote && (
            <p className="mt-1 text-sm text-dust">{product.conditionNote}</p>
          )}
          {!product.conditionNote && product.inspected && (
            <p className="mt-1 text-sm text-dust">Inspectée, comme neuf.</p>
          )}

          {sold ? (
            <Link
              href={categoryHref}
              className="mt-4 inline-flex items-center gap-2 rounded-full border border-hairline-strong px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-verdigris hover:text-verdigris-deep"
            >
              Vendu, voir des articles similaires
              <ArrowRight aria-hidden className="h-3.5 w-3.5" />
            </Link>
          ) : (
            <>
              <p className="mt-3 font-mono text-lg font-semibold text-ink">
                {formatPrice(product.salePrice)} €
                <span className="ml-2 text-xs font-normal text-dust">TTC</span>
              </p>
              <Link
                href={`/product/${product.slug}`}
                className="mt-3 inline-flex items-center gap-2 rounded-full bg-verdigris px-5 py-2.5 text-sm font-semibold text-stone transition-colors hover:bg-verdigris-deep"
              >
                Voir l’article
                <ArrowRight aria-hidden className="h-3.5 w-3.5" />
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
