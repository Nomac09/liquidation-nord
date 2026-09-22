// Client-side event helpers.
//
// Two independent channels, on purpose:
//
//   1. GA4, which only ever fires once the visitor has granted analytics
//      consent. Everything here degrades to a no-op when gtag is absent,
//      so a refused banner or a blocker costs nothing but the numbers.
//   2. A first-party beacon to /api/track/affiliate-click, which stores no
//      identifier of any kind and therefore runs whatever the consent
//      state is. Without it, refusing cookies would make affiliate
//      performance invisible, and the honest ordering would be to stop
//      asking rather than to guess.
//
// Outbound clicks use sendBeacon / transport_type: 'beacon' because the
// page is being torn down as the request is made: a normal fetch to a
// third party is routinely cancelled mid-flight by the navigation, which
// is exactly why affiliate click counts under-report.

type GtagParams = Record<string, string | number | boolean | undefined>

declare global {
  interface Window {
    gtag?: (command: string, ...args: unknown[]) => void
    dataLayer?: unknown[]
  }
}

export function trackEvent(name: string, params: GtagParams = {}) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return
  window.gtag('event', name, { ...params, transport_type: 'beacon' })
}

export interface AffiliateClickPayload {
  affiliateId: string
  merchant: string
  productName: string
  category: string
  pageSlug: string
  position: number
}

export function trackAffiliateClick(payload: AffiliateClickPayload) {
  trackEvent('affiliate_click', {
    affiliate_id: payload.affiliateId,
    merchant: payload.merchant,
    product_name: payload.productName,
    category: payload.category,
    page_slug: payload.pageSlug,
    position: payload.position,
  })

  if (typeof navigator === 'undefined') return
  // No product name and no category: the server record is deliberately
  // the minimum that answers "which link, on which page, how often".
  const body = JSON.stringify({
    affiliateId: payload.affiliateId,
    merchant: payload.merchant,
    pageSlug: payload.pageSlug,
    position: payload.position,
  })

  try {
    if (typeof navigator.sendBeacon === 'function') {
      navigator.sendBeacon('/api/track/affiliate-click', new Blob([body], { type: 'application/json' }))
      return
    }
    // Older Safari: keepalive keeps the request alive past the unload.
    void fetch('/api/track/affiliate-click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    }).catch(() => {})
  } catch {
    // Analytics must never be able to break an outbound click.
  }
}

export function trackOwnProductClick(params: {
  productId: string
  category: string
  pageSlug: string
  position: number
  price: number
}) {
  trackEvent('own_product_click', {
    product_id: params.productId,
    category: params.category,
    page_slug: params.pageSlug,
    position: params.position,
    price: params.price,
  })
}
