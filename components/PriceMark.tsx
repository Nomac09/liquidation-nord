import { formatPrice } from '@/components/Sticker'

// The quiet-premium price treatment: the sale price *is* "the price" —
// set large, in the serif, in ink. The RRP is a small, struck-through
// reference beside it, the same register a consignment shop uses for
// "estimated retail" — never a colored badge, never a percentage shout.
// Replaces <Sticker> for pages migrated to the new identity; kept as a
// separate component rather than a variant since the two treatments
// share no layout logic and Sticker still serves every unmigrated page.
export default function PriceMark({
  price,
  rrp,
  size = 'md',
}: {
  price: number
  rrp?: number
  size?: 'md' | 'lg'
}) {
  const discount = rrp && rrp > price ? Math.round((1 - price / rrp) * 100) : null

  return (
    <span className="inline-flex items-baseline gap-3">
      <span className={`font-serif text-ink ${size === 'lg' ? 'text-4xl' : 'text-2xl'}`}>
        {formatPrice(price)} €
      </span>
      {rrp && rrp > price && (
        <span className="font-mono text-xs text-dust">
          <s>{formatPrice(rrp)} €</s>
          {discount !== null && <span className="ml-1.5 text-verdigris-deep">−{discount} %</span>}
        </span>
      )}
    </span>
  )
}
