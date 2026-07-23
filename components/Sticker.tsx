// L'étiquette — the clearance-sticker price chip, the site's signature element.
// `tilted` renders it slightly rotated; pair with `group-hover:rotate-0` contexts.
export function formatPrice(n: number) {
  return n.toLocaleString('fr-FR', {
    minimumFractionDigits: n % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })
}

export default function Sticker({
  price,
  rrp,
  size = 'md',
  tilted = true,
}: {
  price: number
  rrp?: number
  size?: 'md' | 'lg'
  tilted?: boolean
}) {
  const discount = rrp && rrp > price ? Math.round((1 - price / rrp) * 100) : null

  return (
    <span className="inline-flex items-center gap-2">
      <span
        className={`sticker transition-transform duration-300 ${
          size === 'lg' ? 'text-2xl' : 'text-base'
        } ${tilted ? '-rotate-2 group-hover:rotate-0' : ''}`}
      >
        {formatPrice(price)}
        <span className={size === 'lg' ? 'text-base' : 'text-xs'}>€</span>
      </span>
      {rrp && rrp > price && (
        <span className={`flex flex-col leading-tight ${size === 'lg' ? 'text-sm' : 'text-xs'}`}>
          <s className="font-mono text-gris">{formatPrice(rrp)} €</s>
          {discount !== null && (
            <span className="font-mono font-semibold text-orange-deep">−{discount} %</span>
          )}
        </span>
      )}
    </span>
  )
}
