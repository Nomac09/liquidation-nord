import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, CheckCircle2, Clock, Package, XCircle } from 'lucide-react'
import { auth } from '@/auth'
import connectDB from '@/lib/mongodb'
import Order from '@/lib/schemas/Order'
import { formatPrice } from '@/components/Sticker'
import { resolveOrderStatus } from '@/lib/orderStatus'

export const dynamic = 'force-dynamic'

const SHIPPING_LABELS: Record<string, string> = {
  pickup: 'Retrait à Bondues',
  relay: 'Point relais',
  home: 'À domicile',
}

const STATUS_ICON = {
  error: XCircle,
  pending: Clock,
  progress: Package,
  success: CheckCircle2,
} as const

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>
}) {
  const { orderId } = await params
  const session = await auth()
  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/account/orders/${orderId}`)}`)
  }

  await connectDB()
  // Ownership check via userId, not just orderId — this is the only
  // thing standing between a signed-in customer and someone else's order
  // if they guess or share a link.
  const doc = await Order.findOne({ orderId, userId: session.user.id }).lean()
  if (!doc) {
    notFound()
  }
  const order = JSON.parse(JSON.stringify(doc))

  const status = resolveOrderStatus(order)
  const StatusIcon = STATUS_ICON[status.tone]
  const toneClass = {
    error: 'border-alert bg-alert-pale text-alert',
    pending: 'border-hairline bg-paper text-dust',
    progress: 'border-verdigris bg-verdigris/10 text-verdigris-deep',
    success: 'border-verdigris bg-verdigris text-stone',
  }[status.tone]

  const showTracking =
    order.shippingMethod !== 'pickup' &&
    ['label_created', 'shipped', 'delivered'].includes(order.deliveryStatus) &&
    order.trackingNumber

  return (
    <div className="container mx-auto max-w-2xl px-4 py-10">
      <Link href="/account" className="mb-6 inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-widest text-dust hover:text-ink">
        <ChevronLeft aria-hidden className="h-3.5 w-3.5" />
        Retour à mon compte
      </Link>

      <p className="font-mono text-[11px] uppercase tracking-widest text-dust">{order.orderId}</p>
      <h1 className="mt-1 font-display text-3xl tracking-tight text-ink">
        Commande du {new Date(order.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
      </h1>

      <div className={`mt-6 flex items-center gap-3 rounded-xl border p-4 ${toneClass}`}>
        <StatusIcon aria-hidden className="h-6 w-6 shrink-0" />
        <div>
          <p className="font-semibold">{status.label}</p>
          {order.paymentStatus === 'paid' && order.deliveryStatus !== 'delivered' && (
            <p className="mt-0.5 text-sm opacity-90">
              {order.shippingMethod === 'pickup'
                ? 'On vous prévient dès que c’est prêt à récupérer à Bondues.'
                : 'On vous prévient dès que le colis part de l’entrepôt.'}
            </p>
          )}
        </div>
      </div>

      {showTracking && (
        <div className="mt-4 rounded-xl border border-hairline bg-surface p-4 shadow-carte">
          <p className="tag-label">Numéro de suivi</p>
          <p className="mt-1 font-mono text-sm text-ink">{order.trackingNumber}</p>
        </div>
      )}

      <div className="mt-6 rounded-xl border border-hairline bg-surface p-6 shadow-carte">
        <h2 className="tag-label border-b border-dashed border-hairline pb-3">Pièces commandées</h2>
        <ul className="mt-3 divide-y divide-hairline">
          {order.items.map((item: { productId: string; name: string; price: number }, i: number) => (
            <li key={`${item.productId}-${i}`} className="flex items-center justify-between gap-4 py-3">
              <span className="text-sm text-ink">{item.name}</span>
              <span className="shrink-0 font-mono text-sm font-semibold text-ink">{formatPrice(item.price)} €</span>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-1.5 border-t border-hairline pt-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-dust">Sous-total</dt>
            <dd className="font-mono">{formatPrice(order.subtotal)} €</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-dust">Livraison</dt>
            <dd className="font-mono">{formatPrice(order.shippingCost)} €</dd>
          </div>
          <div className="flex justify-between border-t border-hairline pt-1.5 text-base font-semibold">
            <dt>Total</dt>
            <dd className="font-mono">{formatPrice(order.total)} €</dd>
          </div>
        </dl>
      </div>

      <div className="mt-6 rounded-xl border border-hairline bg-surface p-6 shadow-carte">
        <h2 className="tag-label border-b border-dashed border-hairline pb-3">Livraison</h2>
        <p className="mt-3 text-sm text-ink">{SHIPPING_LABELS[order.shippingMethod] || order.shippingMethod}</p>
        {order.shippingMethod !== 'pickup' && order.shippingDetails && (
          <p className="mt-1 text-sm text-dust">
            {order.shippingDetails.line1}
            {order.shippingDetails.line2 ? `, ${order.shippingDetails.line2}` : ''}
            <br />
            {order.shippingDetails.postalCode} {order.shippingDetails.city}
          </p>
        )}
      </div>

      <p className="mt-6 text-center text-xs text-dust">
        Une question sur cette commande ?{' '}
        <a href="mailto:contact@souqify.fr" className="text-verdigris-deep hover:underline">contact@souqify.fr</a>
      </p>
    </div>
  )
}
