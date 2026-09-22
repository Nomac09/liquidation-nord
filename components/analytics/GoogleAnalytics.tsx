'use client'

import Script from 'next/script'
import { useEffect } from 'react'
import { useConsent } from '@/lib/consent'

const GA_ID = process.env.NEXT_PUBLIC_GA_ID

/**
 * GA4 behind Consent Mode v2, denied by default.
 *
 * Two layers, deliberately belt and braces:
 *
 *   1. The consent defaults are declared before anything else runs, so
 *      any gtag call made by any code path is gated rather than trusted.
 *   2. gtag.js itself is not loaded at all until the visitor has
 *      accepted. Consent Mode alone would still fire cookieless pings to
 *      Google on every page view, which satisfies Google but not the
 *      CNIL's position that a non-exempt tracker should not contact its
 *      server before consent. Not loading it is simply stricter, and
 *      costs nothing but modelled data we were never going to rely on.
 *
 * With no NEXT_PUBLIC_GA_ID set, this renders nothing at all, which is
 * the state the site ships in until the measurement ID exists.
 */
export default function GoogleAnalytics() {
  const decision = useConsent((s) => s.decision)
  const granted = decision === 'granted'

  // Tell gtag the moment consent changes, including a withdrawal in the
  // same session: the script stays loaded once loaded, so revoking has to
  // be an explicit update rather than an unmount.
  useEffect(() => {
    if (!GA_ID || typeof window === 'undefined' || typeof window.gtag !== 'function') return
    window.gtag('consent', 'update', {
      analytics_storage: granted ? 'granted' : 'denied',
    })
  }, [granted])

  if (!GA_ID) return null

  return (
    <>
      <Script id="ga-consent-default" strategy="beforeInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('consent', 'default', {
            ad_storage: 'denied',
            ad_user_data: 'denied',
            ad_personalization: 'denied',
            analytics_storage: 'denied',
            wait_for_update: 500
          });
        `}
      </Script>

      {granted && (
        <>
          <Script
            id="ga-src"
            strategy="afterInteractive"
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
          />
          <Script id="ga-init" strategy="afterInteractive">
            {`
              gtag('js', new Date());
              gtag('consent', 'update', { analytics_storage: 'granted' });
              gtag('config', '${GA_ID}', { anonymize_ip: true });
            `}
          </Script>
        </>
      )}
    </>
  )
}
