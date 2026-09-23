'use client'

import { useEffect } from 'react'
import { trackEvent } from '@/lib/analytics'

/**
 * Fires guide_view once per mount. Renders nothing.
 *
 * A separate component rather than an effect in the page, because the
 * page is a server component: this is the smallest possible client
 * boundary, so a guide stays fully server-rendered apart from one
 * zero-markup island.
 */
export default function GuideViewTracker({
  pageSlug,
  category,
  hasAffiliateLinks,
}: {
  pageSlug: string
  category: string
  hasAffiliateLinks: boolean
}) {
  useEffect(() => {
    trackEvent('guide_view', {
      page_slug: pageSlug,
      category,
      has_affiliate_links: hasAffiliateLinks,
    })
  }, [pageSlug, category, hasAffiliateLinks])

  return null
}
