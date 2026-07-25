import Link from 'next/link'
import { CheckCircle2, XCircle } from 'lucide-react'
import connectDB from '@/lib/mongodb'
import User from '@/lib/schemas/User'

export const dynamic = 'force-dynamic'

async function verify(token: string | undefined) {
  if (!token) return 'invalid' as const

  await connectDB()
  const user = await User.findOne({ verificationToken: token })
  if (!user) return 'invalid' as const

  if (!user.verificationTokenExpires || user.verificationTokenExpires.getTime() < Date.now()) {
    return 'expired' as const
  }

  user.emailVerified = new Date()
  user.verificationToken = undefined
  user.verificationTokenExpires = undefined
  await user.save()
  return 'success' as const
}

export default async function VerifyEmailPage({
  params,
}: {
  params: Promise<{ token?: string }>
}) {
  const { token } = await params
  const result = await verify(token)

  return (
    <div className="container mx-auto max-w-sm px-4 py-24 text-center">
      {result === 'success' ? (
        <>
          <CheckCircle2 aria-hidden className="mx-auto h-10 w-10 text-bleu" />
          <h1 className="mt-4 font-display text-2xl font-bold tracking-tight text-encre">
            Email confirmé
          </h1>
          <p className="mt-2 text-sm text-gris">
            Votre adresse email est vérifiée. Vous pouvez maintenant passer commande.
          </p>
          <Link
            href="/account"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-bleu px-8 py-3 text-sm font-semibold text-blanc transition-colors hover:bg-bleu-deep"
          >
            Aller à mon compte
          </Link>
        </>
      ) : (
        <>
          <XCircle aria-hidden className="mx-auto h-10 w-10 text-orange-deep" />
          <h1 className="mt-4 font-display text-2xl font-bold tracking-tight text-encre">
            {result === 'expired' ? 'Lien expiré' : 'Lien invalide'}
          </h1>
          <p className="mt-2 text-sm text-gris">
            {result === 'expired'
              ? 'Ce lien de vérification a expiré. Connectez-vous à votre compte pour en recevoir un nouveau.'
              : 'Ce lien de vérification est invalide, ou votre email a peut-être déjà été confirmé.'}
          </p>
          <Link
            href="/login?callbackUrl=/account"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-bleu px-8 py-3 text-sm font-semibold text-blanc transition-colors hover:bg-bleu-deep"
          >
            Se connecter
          </Link>
        </>
      )}
    </div>
  )
}
