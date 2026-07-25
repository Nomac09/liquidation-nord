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
      <p className="mt-5 flex items-start gap-2.5 text-[13.5px] leading-relaxed">
        <CheckCircle2 aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-verdigris-deep" />
        <span className="text-ink">
          <span className="font-medium">Inspectée, comme neuf.</span>
          {note && <span className="text-dust"> {note}</span>}
        </span>
      </p>
    )
  }

  return (
    <p className="mt-5 flex items-start gap-2.5 text-[13.5px] leading-relaxed text-dust">
      <ShieldCheck aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-verdigris-deep" />
      Pièce en stock limité — photos contractuelles.{' '}
      <a href="mailto:contact@souqify.fr" className="text-verdigris-deep hover:underline">
        Contactez-nous
      </a>{' '}
      pour tout détail avant votre commande.
    </p>
  )
}
