'use client'

import Image from 'next/image'
import { ExternalLink, Check, Minus } from 'lucide-react'
import AffiliateDisclosure from '@/components/mdx/AffiliateDisclosure'
import { trackAffiliateClick } from '@/lib/analytics'

export interface AffiliateProductProps {
  /** Internal id, e.g. "amz-toile-auvent-3x4". Stable across edits. */
  id: string
  merchant: 'amazon' | 'awin' | 'affilae'
  merchantName: string
  name: string
  /** Full tagged URL. Points straight at the merchant, never via a redirect. */
  url: string
  reason: string
  pros: string[]
  cons: string[]
  image?: { src: string; alt: string }
  category: string
  /** Injected by the guide page, not written in MDX. */
  pageSlug?: string
  position?: number
}

/**
 * A recommendation for something we do not sell.
 *
 * Three rules here are Amazon Associates operating-agreement requirements
 * rather than design preferences, and breaking any of them can close the
 * account:
 *
 *   - No price. Prices may only be displayed if they come from the
 *     Product Advertising API and are kept current; we have no API access,
 *     so the card sends the reader to check instead of quoting a number
 *     that will be wrong within the week.
 *   - No Amazon imagery. Copied or hotlinked product images are not
 *     licensed. `image` is for our own photography; with none, the card
 *     renders as clean text rather than a broken frame.
 *   - rel="sponsored nofollow", and a direct link. No cloaking redirect.
 *
 * The rest is about not lying to the reader: a distinct surface from our
 * own cards, no cart affordance, no strikethrough, no discount badge, and
 * the seller named on the card itself.
 */
export default function AffiliateProduct({
  id,
  merchant,
  merchantName,
  name,
  url,
  reason,
  pros,
  cons,
  image,
  category,
  pageSlug = '',
  position = 0,
}: AffiliateProductProps) {
  const onClick = () => {
    trackAffiliateClick({
      affiliateId: id,
      merchant,
      productName: name,
      category,
      pageSlug,
      position,
    })
  }

  return (
    <div className="my-6 overflow-hidden rounded-xl border border-dashed border-hairline-strong bg-paper">
      <div className="flex flex-col gap-4 p-5 sm:flex-row">
        {image && (
          <div className="relative h-36 w-full shrink-0 overflow-hidden rounded-lg bg-surface sm:h-32 sm:w-32">
            <Image src={image.src} alt={image.alt} fill className="object-cover" sizes="128px" />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <p className="inline-flex items-center rounded-full bg-ink px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-stone">
            Lien partenaire
          </p>

          <h3 className="mt-2.5 font-display text-lg leading-snug text-ink">{name}</h3>
          <p className="mt-1 text-xs text-dust">
            Vendu par {merchantName}, pas par Souqify
          </p>

          <p className="mt-3 text-[15px] leading-relaxed text-ink/85">{reason}</p>

          {(pros.length > 0 || cons.length > 0) && (
            <div className="mt-3 grid gap-x-6 gap-y-2 sm:grid-cols-2">
              {pros.length > 0 && (
                <ul className="space-y-1">
                  {pros.map((p) => (
                    <li key={p} className="flex items-start gap-1.5 text-sm text-ink/85">
                      <Check aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0 text-verdigris-deep" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              )}
              {cons.length > 0 && (
                <ul className="space-y-1">
                  {cons.map((c) => (
                    <li key={c} className="flex items-start gap-1.5 text-sm text-dust">
                      <Minus aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div className="mt-4">
            <a
              href={url}
              target="_blank"
              rel="sponsored nofollow noopener"
              onClick={onClick}
              className="inline-flex items-center gap-2 rounded-full border border-ink px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-ink hover:text-stone"
            >
              Voir sur {merchantName}
              <ExternalLink aria-hidden className="h-3.5 w-3.5" />
              <span className="sr-only">
                Lien partenaire, s’ouvre dans un nouvel onglet
              </span>
            </a>
            {merchant === 'amazon' && (
              <p className="mt-2 text-xs text-dust">Voir le prix actuel sur {merchantName}</p>
            )}
            <p className="mt-1.5">
              <AffiliateDisclosure variant="inline" />
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
