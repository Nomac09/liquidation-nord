'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AyooshiEntry() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    // Use the correct password from your .env
    if (password === 'FreEPalestine2026*!!') {
      sessionStorage.setItem('ayooshi-auth', 'true')
      router.push('/ayooshi/dashboard')
    } else {
      setError('Mot de passe incorrect')
    }
  }

  return (
    <div className="min-h-screen bg-beige flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-sm w-96">
        <h1 className="text-2xl font-bold text-anthracite mb-6">
          Ayooshi Admin 🔐
        </h1>
        <form onSubmit={handleLogin} className="space
<div>
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
            <p className="text-red-500 text-sm">{error}</p>
          )}
          <button
            type="submit"
            className="w-full bg-oak text-white py-2 rounded-lg font-semibold hover:bg-anthracite transition-colors"
          >
            Entrer
          </button>
        </form>
      </div>
    </div>
  )
}
