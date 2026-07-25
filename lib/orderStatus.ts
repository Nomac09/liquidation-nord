export type ShippingMethod = 'pickup' | 'relay' | 'home'
export type DeliveryStatus = 'pending' | 'ready_for_pickup' | 'label_created' | 'shipped' | 'delivered'
export type PaymentStatus = 'pending' | 'paid' | 'failed'

export const DELIVERY_STATUS_LABELS: Record<DeliveryStatus, string> = {
  pending: 'En préparation',
  ready_for_pickup: 'Prête pour le retrait',
  label_created: 'Étiquette créée',
  shipped: 'Expédiée',
  delivered: 'Livrée',
}

// Which deliveryStatus values are meaningful for a given shipping method —
// 'ready_for_pickup' makes no sense for a shipped order, 'shipped' makes
// no sense for something collected in person.
export function deliveryStatusOptions(shippingMethod: ShippingMethod): DeliveryStatus[] {
  return shippingMethod === 'pickup'
    ? ['pending', 'ready_for_pickup', 'delivered']
    : ['pending', 'label_created', 'shipped', 'delivered']
}

// The single "real status" a customer actually cares about — payment
// gates everything else, since delivery prep never truly starts until
// the order is paid regardless of what deliveryStatus happens to hold.
export function resolveOrderStatus(order: { paymentStatus: string; deliveryStatus: string }): {
  label: string
  tone: 'error' | 'pending' | 'progress' | 'success'
} {
  if (order.paymentStatus === 'failed') {
    return { label: 'Paiement échoué', tone: 'error' }
  }
  if (order.paymentStatus === 'pending') {
    return { label: 'En attente de paiement', tone: 'pending' }
  }
  if (order.deliveryStatus === 'delivered') {
    return { label: 'Livrée', tone: 'success' }
  }
  return {
    label: DELIVERY_STATUS_LABELS[order.deliveryStatus as DeliveryStatus] || order.deliveryStatus,
    tone: 'progress',
  }
}
