import { formatPrice } from '@/components/Sticker'
import { getComparisonDisplay } from '@/lib/pricing'

/**
 * The price, and beside it what the same article costs elsewhere.
 *
 * What changed, and why it matters: the struck-through `rrp` this used to
 * render was a recommended retail price from a liquidation manifest, with
 * no stated source and no observation date. A struck-through figure next
 * to a percentage reads, to everybody, as "this is what it used to cost
 * here" — and that reading is a reduction announcement, which art.
 * L112-1-1 only lets us make against our own lowest price of the previous
 * 30 days. We never had one.
 *
 * So the comparison is no longer struck through and no longer anonymous.
 * It names the retailer and the day the price was seen there, in plain
 * text, and it disappears entirely once that day is more than 90 days
 * old. If any of that is missing, only the price shows, which is the
 * correct thing for a shop to show anyway.
 */
export default function PriceMark({
  price,
  comparePrice,
  comparePriceCheckedAt,
  comparePriceSource,
  discountPercent,
  size = 'md',
}: {
  price: number
  comparePrice?: number | null
  comparePriceCheckedAt?: Date | string | null
  comparePriceSource?: string | null
  discountPercent?: number | null
  size?: 'sm' | 'md' | 'lg'
}) {
  const comparison = getComparisonDisplay({
    price,
    comparePrice,
    comparePriceCheckedAt,
    comparePriceSource,
    discountPercent,
  })

  const priceSize = size === 'lg' ? 'text-4xl' : size === 'sm' ? 'text-lg' : 'text-2xl'

  return (
    <span className="inline-flex flex-col gap-1">
      <span className="inline-flex items-baseline gap-2.5">
        <span className={`font-serif text-ink ${priceSize}`}>{formatPrice(price)} €</span>
        {comparison.show && comparison.discountPercent != null && (
          <span className="font-mono text-xs font-semibold text-verdigris-deep">
            −{comparison.discountPercent} % vs vidaXL
          </span>
        )}
      </span>
      {comparison.show && (
        <span className="font-mono text-[11px] leading-snug text-dust">
          Prix constaté sur {comparison.source} le {comparison.checkedAtLabel} :{' '}
          {formatPrice(comparison.comparePrice!)} €
        </span>
      )}
    </span>
  )
}
