import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import connectDB from '@/lib/mongodb'
import User from '@/lib/schemas/User'
import AccountForm from '@/components/AccountForm'

export const dynamic = 'force-dynamic'

export default async function AccountPage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/login?callbackUrl=/account')
  }

  await connectDB()
  const doc = await User.findById(session.user.id).select('email name phone address').lean()
  if (!doc) {
    redirect('/login?callbackUrl=/account')
  }
  const user = JSON.parse(JSON.stringify(doc))

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
      <div className="mt-8">
        <AccountForm initial={initial} />
      </div>
    </div>
  )
}
