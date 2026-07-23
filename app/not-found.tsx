import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="container mx-auto px-4 py-24 text-center">
      <p className="tag-label">Erreur 404</p>
      <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-encre">
        Cette pièce n’est plus là.
      </h1>
      <p className="mx-auto mt-3 max-w-md text-gris">
        Elle a peut-être déjà trouvé preneur — c’est la règle du déstockage.
        L’arrivage se renouvelle à chaque palette.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center gap-2 rounded-full bg-bleu px-8 py-3 text-sm font-semibold text-blanc transition-colors hover:bg-bleu-deep"
      >
        Voir ce qui reste
        <ArrowRight aria-hidden className="h-4 w-4" />
      </Link>
    </div>
  )
}
