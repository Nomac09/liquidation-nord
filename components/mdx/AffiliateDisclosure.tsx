import Link from 'next/link'
import { Info } from 'lucide-react'

export const DISCLOSURE_TEXT =
  'Cet article contient des liens partenaires signalés par le badge « Lien partenaire ». ' +
  'En tant que Partenaire Amazon, je réalise un bénéfice sur les achats remplissant les ' +
  'conditions requises. Souqify n’est pas le vendeur de ces produits.'

/**
 * The disclosure, in the two shapes it needs to take.
 *
 * "banner" sits directly under the H1 of any guide with affiliate links,
 * above the first one. That position is the requirement, not decoration:
 * a disclosure a reader meets after they have already clicked has
 * disclosed nothing, and the FTC/DGCCRF expectation is that it precedes
 * the link rather than following it in a footer.
 */
export default function AffiliateDisclosure({
  variant = 'banner',
}: {
  variant?: 'banner' | 'inline'
}) {
  if (variant === 'inline') {
    return (
      <span className="text-xs text-dust">
        Lien partenaire,{' '}
        <Link href="/transparence-affiliation" className="underline hover:text-ink">
          voir Transparence &amp; affiliation
        </Link>
      </span>
    )
  }

  return (
    <aside
      aria-label="Information sur les liens partenaires"
      className="my-6 flex items-start gap-3 rounded-lg border border-hairline bg-paper px-5 py-4 text-sm leading-relaxed text-ink/85"
    >
      <Info aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-verdigris-deep" />
      <p>
        {DISCLOSURE_TEXT}{' '}
        <Link
          href="/transparence-affiliation"
          className="font-semibold text-verdigris-deep underline underline-offset-2 hover:text-ink"
        >
          Transparence &amp; affiliation
        </Link>
        .
      </p>
    </aside>
  )
}
