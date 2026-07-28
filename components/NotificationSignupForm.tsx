'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'
import { CATEGORIES } from '@/lib/categories'

export default function NotificationSignupForm({
  initialEmail,
  initialCategories,
  initialSubscribed,
}: {
  initialEmail: string
  initialCategories: string[]
  initialSubscribed: boolean
}) {
  const [email, setEmail] = useState(initialEmail)
  const [categories, setCategories] = useState<string[]>(initialCategories)
  const [subscribed, setSubscribed] = useState(initialSubscribed)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const toggleCategory = (value: string) => {
    setCategories((cs) => (cs.includes(value) ? cs.filter((c) => c !== value) : [...cs, value]))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/notifications/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, categories }),
    })
    setSaving(false)
    if (res.ok) {
      setSubscribed(true)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
      <div>
        <label htmlFor="notif-email" className="tag-label">Email pour les alertes</label>
        <input
          id="notif-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1.5 w-full rounded-lg border border-hairline px-3.5 py-2.5 text-sm text-ink focus:border-verdigris"
        />
      </div>

      <fieldset>
        <legend className="tag-label">Catégories — laissez tout décoché pour tout recevoir</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {CATEGORIES.map((c) => {
            const active = categories.includes(c.value)
            return (
              <button
                type="button"
                key={c.value}
                onClick={() => toggleCategory(c.value)}
                aria-pressed={active}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  active ? 'border-verdigris bg-verdigris text-stone' : 'border-hairline text-ink hover:border-verdigris'
                }`}
              >
                {c.label}
              </button>
            )
          })}
        </div>
      </fieldset>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 rounded-full bg-verdigris px-6 py-2.5 text-sm font-semibold text-stone transition-colors hover:bg-verdigris-deep disabled:opacity-60"
        >
          {saved && <Check aria-hidden className="h-4 w-4" />}
          {saving ? 'Enregistrement…' : saved ? 'Enregistré' : subscribed ? 'Mettre à jour mes alertes' : 'Activer les alertes'}
        </button>
        {subscribed && !saved && (
          <p className="text-xs text-dust">Vous êtes inscrit(e) aux alertes nouveautés.</p>
        )}
      </div>
    </form>
  )
}
