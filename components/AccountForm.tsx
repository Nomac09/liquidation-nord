'use client'

import { useState } from 'react'
import { signOut } from 'next-auth/react'
import { Check } from 'lucide-react'

interface Profile {
  email: string
  name: string
  phone: string
  address: {
    line1: string
    line2: string
    postalCode: string
    city: string
    country: string
  }
}

export default function AccountForm({ initial }: { initial: Profile }) {
  const [form, setForm] = useState(initial)
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const set = <K extends keyof Profile>(key: K, value: Profile[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  const setAddr = (key: keyof Profile['address'], value: string) =>
    setForm((f) => ({ ...f, address: { ...f.address, [key]: value } }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setSaved(false)
    const res = await fetch('/api/account', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: form.name, phone: form.phone, address: form.address }),
    })
    setIsSaving(false)
    if (res.ok) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-xl border border-ligne bg-blanc p-6 shadow-carte">
        <h2 className="tag-label border-b border-dashed border-ligne pb-3">Coordonnées</h2>
        <div className="mt-4 space-y-4">
          <div>
            <label htmlFor="acc-email" className="tag-label">Email</label>
            <input
              id="acc-email"
              type="email"
              value={form.email}
              disabled
              className="mt-1.5 w-full rounded-lg border border-ligne bg-beton px-3.5 py-2.5 text-sm text-gris"
            />
          </div>
          <div>
            <label htmlFor="acc-name" className="tag-label">Nom complet</label>
            <input
              id="acc-name"
              type="text"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-ligne px-3.5 py-2.5 text-sm text-encre focus:border-bleu"
            />
          </div>
          <div>
            <label htmlFor="acc-phone" className="tag-label">Téléphone</label>
            <input
              id="acc-phone"
              type="tel"
              placeholder="06 12 34 56 78"
              value={form.phone}
              onChange={(e) => set('phone', e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-ligne px-3.5 py-2.5 text-sm text-encre focus:border-bleu"
            />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-ligne bg-blanc p-6 shadow-carte">
        <h2 className="tag-label border-b border-dashed border-ligne pb-3">Adresse de livraison</h2>
        <div className="mt-4 space-y-4">
          <div>
            <label htmlFor="acc-line1" className="tag-label">Adresse</label>
            <input
              id="acc-line1"
              type="text"
              value={form.address.line1}
              onChange={(e) => setAddr('line1', e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-ligne px-3.5 py-2.5 text-sm text-encre focus:border-bleu"
            />
          </div>
          <div>
            <label htmlFor="acc-line2" className="tag-label">Complément (optionnel)</label>
            <input
              id="acc-line2"
              type="text"
              value={form.address.line2}
              onChange={(e) => setAddr('line2', e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-ligne px-3.5 py-2.5 text-sm text-encre focus:border-bleu"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="acc-postal" className="tag-label">Code postal</label>
              <input
                id="acc-postal"
                type="text"
                value={form.address.postalCode}
                onChange={(e) => setAddr('postalCode', e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-ligne px-3.5 py-2.5 text-sm text-encre focus:border-bleu"
              />
            </div>
            <div>
              <label htmlFor="acc-city" className="tag-label">Ville</label>
              <input
                id="acc-city"
                type="text"
                value={form.address.city}
                onChange={(e) => setAddr('city', e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-ligne px-3.5 py-2.5 text-sm text-encre focus:border-bleu"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={isSaving}
          className="flex items-center gap-2 rounded-full bg-bleu px-8 py-3 text-sm font-semibold text-blanc transition-colors hover:bg-bleu-deep disabled:opacity-60"
        >
          {saved && <Check aria-hidden className="h-4 w-4" />}
          {isSaving ? 'Enregistrement…' : saved ? 'Enregistré' : 'Enregistrer'}
        </button>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: '/' })}
          className="text-sm text-gris underline-offset-2 hover:text-encre hover:underline"
        >
          Se déconnecter
        </button>
      </div>
    </form>
  )
}
