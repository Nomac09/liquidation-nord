import Link from 'next/link'
import { CheckCircle2, XCircle } from 'lucide-react'
import connectDB from '@/lib/mongodb'
import NotificationSubscriber from '@/lib/schemas/NotificationSubscriber'

export const dynamic = 'force-dynamic'

async function unsubscribe(token: string | undefined) {
  if (!token) return false
  await connectDB()
  const result = await NotificationSubscriber.deleteOne({ unsubscribeToken: token })
  return result.deletedCount > 0
}

export default async function UnsubscribePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const ok = await unsubscribe(token)

  return (
    <div className="container mx-auto max-w-sm px-4 py-24 text-center">
      {ok ? (
        <>
          <CheckCircle2 aria-hidden className="mx-auto h-10 w-10 text-bleu" />
          <h1 className="mt-4 font-display text-2xl font-bold tracking-tight text-encre">
            Désinscription confirmée
          </h1>
          <p className="mt-2 text-sm text-gris">
            Vous ne recevrez plus d’alertes de nouvel arrivage.
          </p>
        </>
      ) : (
        <>
          <XCircle aria-hidden className="mx-auto h-10 w-10 text-orange-deep" />
          <h1 className="mt-4 font-display text-2xl font-bold tracking-tight text-encre">
            Lien invalide
          </h1>
          <p className="mt-2 text-sm text-gris">
            Ce lien de désinscription est invalide, ou vous étiez déjà désinscrit(e).
          </p>
        </>
      )}
      <Link
        href="/"
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-bleu px-8 py-3 text-sm font-semibold text-blanc transition-colors hover:bg-bleu-deep"
      >
        Retour à l’arrivage
      </Link>
    </div>
  )
}
