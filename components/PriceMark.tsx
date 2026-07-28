import { formatPrice } from '@/components/Sticker'

// The quiet-premium price treatment: the sale price *is* "the price" —
// set large, in the serif, in ink. The RRP is a small, struck-through
// reference beside it, the same register a consignment shop uses for
// "estimated retail" — never a colored badge, never a percentage shout.
// Replaces <Sticker> everywhere — the old clearance-sticker chip and its
// ticket/perforation styling are fully retired.
export default function PriceMark({
  price,
  rrp,
  size = 'md',
}: {
  price: number
  rrp?: number
  size?: 'sm' | 'md' | 'lg'
}) {
  const discount = rrp && rrp > price ? Math.round((1 - price / rrp) * 100) : null
  const priceSize = size === 'lg' ? 'text-4xl' : size === 'sm' ? 'text-lg' : 'text-2xl'
  const gap = size === 'sm' ? 'gap-2' : 'gap-3'

  return (
    <span className={`inline-flex items-baseline ${gap}`}>
      <span className={`font-serif text-ink ${priceSize}`}>
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
