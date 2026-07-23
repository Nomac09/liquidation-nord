'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (sessionStorage.getItem('admin-password')) {
      setIsAuthenticated(true)
    }
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setChecking(true)
    setError('')
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (res.ok) {
        sessionStorage.setItem('admin-password', password)
        setIsAuthenticated(true)
      } else {
        setError('Mot de passe incorrect')
      }
    } catch {
      setError('Erreur de connexion')
    } finally {
      setChecking(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-beige flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-sm w-96">
          <h1 className="text-2xl font-bold text-anthracite mb-6">
            Administration
          </h1>
          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Mot de passe
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-oak"
                required
              />
            </div>
            {error && (
              <p className="text-red-500 text-sm mb-4">{error}</p>
            )}
            <button
              type="submit"
              disabled={checking}
              className="w-full bg-oak text-white py-2 rounded-lg font-semibold hover:bg-anthracite transition-colors disabled:opacity-60"
            >
              {checking ? 'Vérification…' : 'Connexion'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-beige">
      <nav className="bg-anthracite text-white p-4">
        <div className="container mx-auto flex gap-6">
          <Link href="/admin" className="hover:text-oak">
            Tableau de bord
          </Link>
          <Link href="/admin/upload" className="hover:text-oak">
            Importer produits
          </Link>
          <Link href="/admin/orders" className="hover:text-oak">
            Commandes
          </Link>
          <button
            onClick={() => {
              sessionStorage.removeItem('admin-password')
              router.push('/admin')
            }}
            className="ml-auto hover:text-oak"
          >
            Déconnexion
          </button>
        </div>
      </nav>
      {children}
    </div>
  )
}
