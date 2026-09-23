import Link from 'next/link'
import { ExternalLink } from 'lucide-react'

export interface ComparisonRow {
  product: string
  /** "Souqify" for our own stock, the merchant's name otherwise. */
  soldBy: string
  affiliate?: boolean
  pros: string
  cons: string
  href: string
}

/**
 * Own and partner rows side by side.
 *
 * There is no price column, and that is structural rather than an
 * omission: Amazon prices may not be displayed without the Product
 * Advertising API, and a table with a price for our rows and a blank for
 * theirs invites the reader to read the blank as "more expensive". The
 * columns are what can be said accurately about both.
 */
export default function ComparisonTable({ rows }: { rows: ComparisonRow[] }) {
  return (
    <div className="my-6 overflow-x-auto rounded-lg border border-hairline">
      <table className="w-full min-w-[640px] text-sm">
        <thead className="bg-paper text-left">
          <tr>
            <th scope="col" className="px-4 py-3 font-semibold text-ink">Produit</th>
            <th scope="col" className="px-4 py-3 font-semibold text-ink">Vendu par</th>
            <th scope="col" className="px-4 py-3 font-semibold text-ink">Points forts</th>
            <th scope="col" className="px-4 py-3 font-semibold text-ink">Limites</th>
            <th scope="col" className="px-4 py-3 font-semibold text-ink">Lien</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-hairline">
          {rows.map((row) => (
            <tr key={row.product} className={row.affiliate ? 'bg-paper/40' : undefined}>
              <th scope="row" className="px-4 py-3 text-left font-medium text-ink">
                {row.product}
                {row.affiliate && (
                  <span className="ml-2 inline-flex items-center rounded-full bg-ink px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-stone">
                    Lien partenaire
                  </span>
                )}
              </th>
              <td className="px-4 py-3 text-ink/85">{row.soldBy}</td>
              <td className="px-4 py-3 text-ink/85">{row.pros}</td>
              <td className="px-4 py-3 text-dust">{row.cons}</td>
              <td className="px-4 py-3">
                {row.affiliate ? (
                  <a
                    href={row.href}
                    target="_blank"
                    rel="sponsored nofollow noopener"
                    className="inline-flex items-center gap-1.5 font-semibold text-verdigris-deep underline underline-offset-2 hover:text-ink"
                  >
                    Voir sur {row.soldBy}
                    <ExternalLink aria-hidden className="h-3 w-3" />
                    <span className="sr-only">Lien partenaire, s’ouvre dans un nouvel onglet</span>
                  </a>
                ) : (
                  <Link href={row.href} className="font-semibold text-verdigris-deep underline underline-offset-2 hover:text-ink">
                    Voir l’article
                  </Link>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
