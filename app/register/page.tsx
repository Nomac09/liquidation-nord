'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { AlertCircle } from 'lucide-react'

function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/account'

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    })

    if (res.status === 409) {
      setError('Un compte existe déjà avec cet email.')
      setIsLoading(false)
      return
    }
    if (!res.ok) {
      setError('Le mot de passe doit contenir au moins 8 caractères.')
      setIsLoading(false)
      return
    }

    const signInRes = await signIn('credentials', { email, password, redirect: false })
    if (signInRes?.error) {
      setError('Compte créé, mais la connexion a échoué — réessayez de vous connecter.')
      setIsLoading(false)
      return
    }
    router.push(callbackUrl)
    router.refresh()
  }

  return (
    <div className="container mx-auto max-w-sm px-4 py-16">
      <h1 className="font-display text-3xl font-bold tracking-tight text-encre">
        Créer un compte
      </h1>

      <div className="mt-6 rounded-xl border border-ligne bg-blanc p-6 shadow-carte">
        <h2 className="tag-label border-b border-dashed border-ligne pb-3">Inscription</h2>

        <button
          onClick={() => signIn('google', { callbackUrl })}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-full border border-ligne bg-blanc py-3 text-sm font-semibold text-encre transition-colors hover:border-gris"
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
          <div className="h-px flex-1 bg-ligne" />
          <span className="font-mono text-[10px] uppercase tracking-widest text-gris">ou</span>
          <div className="h-px flex-1 bg-ligne" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="tag-label">Nom complet</label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-ligne px-3.5 py-2.5 text-sm text-encre focus:border-bleu"
            />
          </div>
          <div>
            <label htmlFor="email" className="tag-label">Email</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-ligne px-3.5 py-2.5 text-sm text-encre focus:border-bleu"
            />
          </div>
          <div>
            <label htmlFor="password" className="tag-label">Mot de passe</label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-ligne px-3.5 py-2.5 text-sm text-encre focus:border-bleu"
            />
            <p className="mt-1 text-xs text-gris">8 caractères minimum.</p>
          </div>

          {error && (
            <p role="alert" className="flex items-start gap-2 rounded-lg bg-orange-pale px-3 py-2 text-sm text-orange-deep">
              <AlertCircle aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-full bg-bleu py-3 text-sm font-semibold text-blanc transition-colors hover:bg-bleu-deep disabled:opacity-60"
          >
            {isLoading ? 'Création…' : 'Créer mon compte'}
          </button>
        </form>
      </div>

      <p className="mt-6 text-center text-sm text-gris">
        Déjà un compte ?{' '}
        <Link href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`} className="font-semibold text-bleu hover:underline">
          Se connecter
        </Link>
      </p>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  )
}
