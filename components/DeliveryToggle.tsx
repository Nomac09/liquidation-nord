'use client'

import { useState } from 'react'
import { MapPin, Package, Truck } from 'lucide-react'

const OPTIONS = [
  {
    value: 'pickup' as const,
    icon: MapPin,
    title: 'Je viens la chercher',
    detail: 'Entrepôt de Bondues (59910) · Lun–Sam 9h–18h',
    price: 'Gratuit',
  },
  {
    value: 'relay' as const,
    icon: Package,
    title: 'En point relais',
    detail: 'Mondial Relay · jusqu’à 130 kg · France entière',
    price: '29,99 €',
  },
  {
    value: 'home' as const,
    icon: Truck,
    title: 'Livrée chez moi',
    detail: 'Cocolis · sans limite de poids · 3 à 5 jours',
    price: '79,99 €',
  },
]

export default function DeliveryToggle() {
  const [method, setMethod] = useState<'pickup' | 'relay' | 'home'>('pickup')

  return (
    <fieldset className="space-y-2">
      <legend className="sr-only">Mode de livraison</legend>
      {OPTIONS.map((opt) => {
        const Icon = opt.icon
        const active = method === opt.value
        return (
          <label
            key={opt.value}
            className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 transition-colors ${
              active ? 'border-bleu bg-bleu-pale' : 'border-ligne bg-blanc hover:border-gris'
            }`}
          >
            <input
              type="radio"
              name="delivery"
              value={opt.value}
              checked={active}
              onChange={() => setMethod(opt.value)}
              className="sr-only"
            />
            <Icon aria-hidden className={`h-5 w-5 shrink-0 ${active ? 'text-bleu' : 'text-gris'}`} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-encre">{opt.title}</p>
              <p className="text-xs text-gris">{opt.detail}</p>
            </div>
            <span className={`font-mono text-sm font-semibold ${active ? 'text-bleu' : 'text-encre'}`}>
              {opt.price}
            </span>
          </label>
        )
      })}
    </fieldset>
  )
}
