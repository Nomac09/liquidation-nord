import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import connectDB from '@/lib/mongodb'
import User from '@/lib/schemas/User'
import Order from '@/lib/schemas/Order'
import AccountForm from '@/components/AccountForm'
import EmailVerificationBanner from '@/components/EmailVerificationBanner'
import { formatPrice } from '@/components/Sticker'

export const dynamic = 'force-dynamic'

const PAYMENT_LABELS: Record<string, string> = {
  paid: 'Payée',
  pending: 'En attente',
  failed: 'Échouée',
}

export default async function AccountPage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/login?callbackUrl=/account')
  }

  await connectDB()
  const [doc, orders] = await Promise.all([
    User.findById(session.user.id).select('email name phone address emailVerified passwordHash').lean(),
    Order.find({ userId: session.user.id })
      .select('orderId items total paymentStatus createdAt')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean(),
  ])
  if (!doc) {
    redirect('/login?callbackUrl=/account')
  }
  const user = JSON.parse(JSON.stringify(doc))
  const orderList = JSON.parse(JSON.stringify(orders))
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
            {orderList.map((o: { orderId: string; items: { name: string; quantity: number }[]; total: number; paymentStatus: string; createdAt: string }) => (
              <li key={o.orderId} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className="font-mono text-[11px] uppercase tracking-widest text-gris">{o.orderId}</p>
                  <p className="mt-0.5 truncate text-sm text-encre">
                    {o.items.map((i) => i.name).join(', ')}
                  </p>
                  <p className="mt-0.5 text-xs text-gris">
                    {new Date(o.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    {' · '}
                    {PAYMENT_LABELS[o.paymentStatus] || o.paymentStatus}
                  </p>
                </div>
                <span className="shrink-0 font-mono text-sm font-semibold text-encre">
                  {formatPrice(o.total)} €
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-8">
        <AccountForm initial={initial} />
      </div>
    </div>
  )
}
