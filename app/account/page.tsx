import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { auth } from '@/auth'
import connectDB from '@/lib/mongodb'
import User from '@/lib/schemas/User'
import Order from '@/lib/schemas/Order'
import Favorite from '@/lib/schemas/Favorite'
import Product from '@/lib/schemas/Product'
import NotificationSubscriber from '@/lib/schemas/NotificationSubscriber'
import AccountForm from '@/components/AccountForm'
import EmailVerificationBanner from '@/components/EmailVerificationBanner'
import FavoritesList, { type FavoriteProduct } from '@/components/FavoritesList'
import NotificationSignupForm from '@/components/NotificationSignupForm'
import { formatPrice } from '@/components/Sticker'
import { resolveOrderStatus } from '@/lib/orderStatus'

export const dynamic = 'force-dynamic'

export default async function AccountPage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/login?callbackUrl=/account')
  }

  await connectDB()
  const [doc, orders, favoriteDocs] = await Promise.all([
    User.findById(session.user.id).select('email name phone address emailVerified passwordHash').lean(),
    Order.find({ userId: session.user.id })
      .select('orderId items total paymentStatus deliveryStatus createdAt')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean(),
    Favorite.find({ userId: session.user.id }).sort({ createdAt: -1 }).select('productId').lean(),
  ])
  if (!doc) {
    redirect('/login?callbackUrl=/account')
  }
  const user = JSON.parse(JSON.stringify(doc))
  const notificationSubDoc = await NotificationSubscriber.findOne({ email: user.email }).select('categories').lean()
  const notificationSub = notificationSubDoc ? JSON.parse(JSON.stringify(notificationSubDoc)) : null
  const orderList = JSON.parse(JSON.stringify(orders))

  const favoriteIds = favoriteDocs.map((f) => String(f.productId))
  const favoriteProductDocs = favoriteIds.length
    ? await Product.find({ _id: { $in: favoriteIds } })
        .select('name slug salePrice photos status')
        .lean()
    : []
  const favoriteById = new Map(favoriteProductDocs.map((p) => [String(p._id), p]))
  // Preserve most-recently-favorited-first order; silently drop any
  // favorite whose product no longer resolves (never happens today —
  // products are only ever marked sold/unsellable, never deleted — but
  // cheap to guard against a dangling id).
  const favorites: FavoriteProduct[] = JSON.parse(
    JSON.stringify(favoriteIds.map((id) => favoriteById.get(id)).filter(Boolean))
  )
  // Only Credentials accounts have a passwordHash — Google sign-ins are
  // exempt from verification, so the banner never shows for them.
  const needsVerification = Boolean(user.passwordHash) && !user.emailVerified

  const initial = {
    email: user.email,
    name: user.name || '',
    phone: user.phone || '',
    address: {
      line1: user.address?.line1 || '',
      line2: user.address?.line2 || '',
      postalCode: user.address?.postalCode || '',
      city: user.address?.city || '',
      country: user.address?.country || 'France',
    },
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-10">
      <h1 className="font-display text-3xl font-bold tracking-tight text-encre">
        Mon compte
      </h1>
      <p className="mt-1 text-sm text-gris">
        Ces informations servent à préparer votre commande — nous ne les partageons pas.
      </p>

      {needsVerification && <EmailVerificationBanner className="mt-6" />}

      <div className="mt-8 rounded-xl border border-ligne bg-blanc p-6 shadow-carte">
        <h2 className="tag-label border-b border-dashed border-ligne pb-3">Historique de commandes</h2>
        {orderList.length === 0 ? (
          <p className="mt-4 text-sm text-gris">Aucune commande pour l’instant.</p>
        ) : (
          <ul className="mt-3 divide-y divide-ligne">
            {orderList.map((o: { orderId: string; items: { name: string; quantity: number }[]; total: number; paymentStatus: string; deliveryStatus: string; createdAt: string }) => {
              const status = resolveOrderStatus(o)
              return (
                <li key={o.orderId}>
                  <Link
                    href={`/account/orders/${o.orderId}`}
                    className="flex items-center justify-between gap-4 py-3 transition-colors hover:bg-beton/60"
                  >
                    <div className="min-w-0">
                      <p className="font-mono text-[11px] uppercase tracking-widest text-gris">{o.orderId}</p>
                      <p className="mt-0.5 truncate text-sm text-encre">
                        {o.items.map((i) => i.name).join(', ')}
                      </p>
                      <p className="mt-0.5 text-xs text-gris">
                        {new Date(o.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                        {' · '}
                        {status.label}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="font-mono text-sm font-semibold text-encre">
                        {formatPrice(o.total)} €
                      </span>
                      <ChevronRight aria-hidden className="h-4 w-4 text-gris" />
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <div className="mt-8 rounded-xl border border-ligne bg-blanc p-6 shadow-carte">
        <h2 className="tag-label border-b border-dashed border-ligne pb-3">Mes favoris</h2>
        <p className="mt-3 text-xs text-gris">
          Enregistrer une pièce ne la réserve pas — chaque pièce est unique et peut être vendue avant vous.
        </p>
        <FavoritesList initial={favorites} />
      </div>

      <div className="mt-8 rounded-xl border border-ligne bg-blanc p-6 shadow-carte">
        <h2 className="tag-label border-b border-dashed border-ligne pb-3">Alertes nouvel arrivage</h2>
        <p className="mt-3 text-xs text-gris">
          Soyez prévenu(e) par email dès qu’un nouvel arrivage entre en stock — sur tout, ou juste les catégories qui vous intéressent.
        </p>
        <NotificationSignupForm
          initialEmail={user.email}
          initialCategories={notificationSub?.categories || []}
          initialSubscribed={Boolean(notificationSub)}
        />
      </div>

      <div className="mt-8">
        <AccountForm initial={initial} />
      </div>
    </div>
  )
}
