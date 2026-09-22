'use client'

import { useConsent } from '@/lib/consent'

/**
 * Reopens the consent banner from the footer.
 *
 * Consent has to be as withdrawable as it was grantable, and a visitor
 * who accepted six months ago has no other way back to that choice. A
 * button rather than a link, because nothing is navigated to.
 */
export default function ManageCookiesButton() {
  const reopen = useConsent((s) => s.reopen)

  return (
    <button type="button" onClick={reopen} className="hover:text-[#F6F5F1] hover:underline">
      Gérer mes cookies
    </button>
  )
}
