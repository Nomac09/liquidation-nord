'use client'

import { useEffect } from 'react'
import { trackEvent } from '@/lib/analytics'

/**
 * GA4 view_item. Renders nothing; the smallest possible client boundary
 * on an otherwise fully server-rendered product page.
 *
 * Takes scalars rather than the product object: a server component
 * serialises every field of a prop it hands a client component into the
 * page payload, including ones this never reads, and `ean` must never
 * leave the server.
 */
export default function ViewItemTracker({
  productId,
  name,
  category,
  price,
}: {
  productId: string
  name: string
  category: string
  price: number
}) {
  useEffect(() => {
    trackEvent('view_item', {
      currency: 'EUR',
      value: price,
      item_id: productId,
      item_name: name,
      item_category: category,
    })
  }, [productId, name, category, price])

  return null
}
