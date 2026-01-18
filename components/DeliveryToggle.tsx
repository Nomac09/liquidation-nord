// components/DeliveryToggle.tsx
'use client'

import { useState } from 'react'

export default function DeliveryToggle() {
  const [method, setMethod] = useState<'pickup' | 'relay' | 'home'>('pickup')

  return (
    <div className="space-y-3">
      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="radio"
          name="delivery"
          value="pickup"
          checked={method === 'pickup'}
          onChange={(e) => setMethod(e.target.value as any)}
          className="text-oak"
        />
        <div>
          <p className="font-medium">Retrait gratuit</p>
          <p className="text-sm text-warm-gray">Bondues (59910) • Lun-Sam 9h-18h</p>
        </div>
      </label>
      
      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="radio"
          name="delivery"
          value="relay"
          checked={method === 'relay'}
          onChange={(e) => setMethod(e.target.value as any)}
          className="text-oak"
        />
        <div>
          <p className="font-medium">Point relais • 29.99€</p>
          <p className="text-sm text-warm-gray">Mondial Relay • Max 130kg • France entière</p>
        </div>
      </label>
      
      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="radio"
          name="delivery"
          value="home"
          checked={method === 'home'}
          onChange={(e) => setMethod(e.target.value as any)}
          className="text-oak"
        />
        <div>
          <p className="font-medium">Livraison à domicile • 79.99€</p>
          <p className="text-sm text-warm-gray">Cocolis • Pas de limite de poids • 3-5 jours</p>
        </div>
      </label>
    </div>
  )
}