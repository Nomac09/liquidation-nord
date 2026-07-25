'use client'

import { useEffect, useState } from 'react'
import { adminHeaders } from '@/lib/adminClient'
import { DELIVERY_STATUS_LABELS, deliveryStatusOptions, type DeliveryStatus, type ShippingMethod } from '@/lib/orderStatus'

interface Order {
  orderId: string
  customerEmail: string
  customerName: string
  total: number
  paymentStatus: string
  deliveryStatus: DeliveryStatus
  shippingMethod: ShippingMethod
  trackingNumber?: string
  createdAt: string
  items: { name: string }[]
}

const PAYMENT_LABELS: Record<string, string> = {
  paid: 'Payée',
  pending: 'En attente',
  failed: 'Échouée',
}

const SHIPPING_LABELS: Record<string, string> = {
  pickup: 'Retrait',
  relay: 'Point relais',
  home: 'Domicile',
}

function OrderRow({ order, onSaved }: { order: Order; onSaved: (updated: Partial<Order>) => void }) {
  const [deliveryStatus, setDeliveryStatus] = useState<DeliveryStatus>(order.deliveryStatus)
  const [trackingNumber, setTrackingNumber] = useState(order.trackingNumber || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const dirty = deliveryStatus !== order.deliveryStatus || trackingNumber !== (order.trackingNumber || '')

  const save = async () => {
    setSaving(true)
    setSaved(false)
    const res = await fetch(`/api/admin/orders/${order.orderId}`, {
      method: 'PATCH',
      headers: { ...adminHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ deliveryStatus, trackingNumber }),
    })
    setSaving(false)
    if (res.ok) {
      onSaved({ deliveryStatus, trackingNumber })
      setSaved(true)
      setTimeout(() => setSaved(false), 1500)
    }
  }

  return (
    <tr className="border-b border-ligne align-top">
      <td className="px-4 py-3 font-mono text-xs">{order.orderId}</td>
      <td className="px-4 py-3">
        <p className="text-sm">{order.customerName}</p>
        <p className="text-xs text-gris">{order.customerEmail}</p>
        <p className="mt-1 text-xs text-gris">{order.items.map((i) => i.name).join(', ')}</p>
      </td>
      <td className="px-4 py-3 font-mono text-sm">{order.total}€</td>
      <td className="px-4 py-3">
        <span className={`inline-block rounded-full px-2 py-1 text-xs ${
          order.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : 'bg-orange-pale text-orange-deep'
        }`}>
          {PAYMENT_LABELS[order.paymentStatus] || order.paymentStatus}
        </span>
      </td>
      <td className="px-4 py-3">
        <p className="mb-1 text-xs text-gris">{SHIPPING_LABELS[order.shippingMethod] || order.shippingMethod}</p>
        <select
          value={deliveryStatus}
          onChange={(e) => setDeliveryStatus(e.target.value as DeliveryStatus)}
          className="w-full rounded border border-ligne px-2 py-1 text-xs text-encre"
        >
          {deliveryStatusOptions(order.shippingMethod).map((s) => (
            <option key={s} value={s}>{DELIVERY_STATUS_LABELS[s]}</option>
          ))}
        </select>
        {order.shippingMethod !== 'pickup' && (
          <input
            type="text"
            placeholder="N° de suivi"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            className="mt-1 w-full rounded border border-ligne px-2 py-1 text-xs text-encre"
          />
        )}
        {dirty && (
          <button
            onClick={save}
            disabled={saving}
            className="mt-1.5 w-full rounded bg-bleu px-2 py-1 text-xs font-semibold text-blanc hover:bg-bleu-deep disabled:opacity-50"
          >
            {saving ? 'Enregistrement…' : saved ? 'Enregistré' : 'Enregistrer'}
          </button>
        )}
      </td>
      <td className="px-4 py-3 text-xs text-gris">
        {new Date(order.createdAt).toLocaleDateString('fr-FR')}
      </td>
    </tr>
  )
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/admin/orders', { headers: adminHeaders() })
      const data = await response.json()
      setOrders(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateOrder = (orderId: string, updated: Partial<Order>) => {
    setOrders((prev) => prev.map((o) => (o.orderId === orderId ? { ...o, ...updated } : o)))
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-gris">Chargement des commandes...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 font-display text-3xl font-bold text-encre">
        Gestion des commandes
      </h1>

      <div className="overflow-x-auto rounded-lg border border-ligne bg-blanc shadow-carte">
        <table className="w-full">
          <thead className="bg-encre text-blanc">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Commande</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Client</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Total</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Paiement</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Livraison</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Date</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gris">
                  Aucune commande pour le moment
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <OrderRow
                  key={order.orderId}
                  order={order}
                  onSaved={(updated) => updateOrder(order.orderId, updated)}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
