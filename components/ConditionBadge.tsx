import { CheckCircle2, ShieldCheck } from 'lucide-react'

// Shows "Comme neuf" only for units that have actually been physically
// inspected (product.inspected === true). Everything else gets a neutral,
// non-claiming line — never a condition claim we can't back up.
export default function ConditionBadge({
  inspected,
  note,
}: {
  inspected: boolean
  note?: string
}) {
  if (inspected) {
    return (
      <p className="mt-4 flex items-start gap-2 text-sm leading-relaxed">
        <CheckCircle2 aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-bleu" />
        <span className="text-encre">
          <strong>Comme neuf.</strong>
          {note && <span className="text-gris"> {note}</span>}
        </span>
      </p>
    )
  }

  return (
    <p className="mt-4 flex items-start gap-2 text-sm leading-relaxed text-gris">
      <ShieldCheck aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-bleu" />
      Pièce en stock limité — photos contractuelles. Contactez-nous pour tout
      détail avant votre commande.
    </p>
  )
}
