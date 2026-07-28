'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { AlertCircle } from 'lucide-react'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  // Shop first, collect details later: signing in — however you do it —
  // returns you to wherever you were (explicit callbackUrl, e.g. cart
  // prompting login before checkout) or the homepage. Nothing about
  // authenticating requires visiting the account page.
  const explicitCallback = searchParams.get('callbackUrl')
  const callbackUrl = explicitCallback || '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    const res = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })
    if (res?.error) {
      setError('Email ou mot de passe incorrect.')
      setIsLoading(false)
      return
    }
    router.push(callbackUrl)
    router.refresh()
  }

  return (
    <div className="container mx-auto max-w-sm px-4 py-16">
      <h1 className="font-display text-3xl tracking-tight text-ink">
        Se connecter
      </h1>

      <div className="mt-6 rounded-xl border border-hairline bg-surface p-6 shadow-carte">
        <h2 className="tag-label border-b border-dashed border-hairline pb-3">Connexion</h2>

        <button
          onClick={() => signIn('google', { callbackUrl })}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-full border border-hairline bg-surface py-3 text-sm font-semibold text-ink transition-colors hover:border-hairline-strong"
        >
          <svg aria-hidden className="h-4 w-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47a5.53 5.53 0 0 1-2.4 3.63v3.02h3.88c2.27-2.09 3.57-5.17 3.57-8.84Z" />
            <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.95-2.9l-3.88-3.02c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.27v3.11A12 12 0 0 0 12 24Z" />
            <path fill="#FBBC05" d="M5.27 14.27a7.2 7.2 0 0 1 0-4.54V6.62H1.27a12 12 0 0 0 0 10.76l4-3.11Z" />
            <path fill="#EA4335" d="M12 4.77c1.76 0 3.35.6 4.6 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.27 6.62l4 3.11C6.22 6.88 8.87 4.77 12 4.77Z" />
          </svg>
          Continuer avec Google
        </button>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-hairline" />
          <span className="font-mono text-[10px] uppercase tracking-widest text-dust">ou</span>
          <div className="h-px flex-1 bg-hairline" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="tag-label">Email</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-hairline px-3.5 py-2.5 text-sm text-ink focus:border-verdigris"
            />
          </div>
          <div>
            <label htmlFor="password" className="tag-label">Mot de passe</label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-hairline px-3.5 py-2.5 text-sm text-ink focus:border-verdigris"
            />
          </div>

          {error && (
            <p role="alert" className="flex items-start gap-2 rounded-lg bg-alert-pale px-3 py-2 text-sm text-alert">
              <AlertCircle aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-full bg-verdigris py-3 text-sm font-semibold text-stone transition-colors hover:bg-verdigris-deep disabled:opacity-60"
          >
            {isLoading ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>
      </div>

      <p className="mt-6 text-center text-sm text-dust">
        Pas encore de compte ?{' '}
        <Link
          href={explicitCallback ? `/register?callbackUrl=${encodeURIComponent(explicitCallback)}` : '/register'}
          className="font-semibold text-verdigris-deep hover:underline"
        >
          Créer un compte
        </Link>
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
