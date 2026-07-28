import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="container mx-auto px-4 py-24 text-center">
      <p className="tag-label">Erreur 404</p>
      <h1 className="mt-3 font-display text-3xl tracking-tight text-ink">
        Cette pièce n’est plus là.
      </h1>
      <p className="mx-auto mt-3 max-w-md text-dust">
        Elle a peut-être déjà trouvé preneur — c’est la règle du déstockage.
        La collection se renouvelle régulièrement.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center gap-2 rounded-full bg-verdigris px-8 py-3 text-sm font-semibold text-stone transition-colors hover:bg-verdigris-deep"
      >
        Voir ce qui reste
        <ArrowRight aria-hidden className="h-4 w-4" />
      </Link>
    </div>
  )
}
