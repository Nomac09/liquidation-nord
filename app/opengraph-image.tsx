import { ImageResponse } from 'next/og'
import { BRAND_NAME } from '@/lib/brand'

export const alt = 'Souqify, déstockage jardin, mobilier et déco à Bondues (59)'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

/**
 * The site-wide share image.
 *
 * Generated rather than a file in public/, so the wordmark and the
 * palette cannot drift from the site the way a hand-exported PNG does.
 * Living at the app root, it covers the homepage, /guides and every
 * guide; product pages override it with their own photograph, which is a
 * better share image than any generated card.
 *
 * No custom font is loaded on purpose: fetching one at build time turns
 * every deploy into a network dependency, and the system serif is close
 * enough at this size to be worth that.
 */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: '#F6F5F1',
          padding: '72px',
          fontFamily: 'Georgia, serif',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 34, letterSpacing: '0.18em', color: '#6E6C64' }}>
            DÉSTOCKAGE · BONDUES (59)
          </div>
          <div style={{ display: 'flex', fontSize: 132, fontStyle: 'italic', marginTop: 24 }}>
            <span style={{ color: '#22221F' }}>Souq</span>
            <span style={{ color: '#4B5A46' }}>ify</span>
          </div>
          <div
            style={{
              fontSize: 42,
              color: '#22221F',
              opacity: 0.85,
              marginTop: 16,
              maxWidth: 900,
              lineHeight: 1.3,
            }}
          >
            Surstocks et retours open-box, à moitié prix.
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            borderTop: '2px solid #D3D0C8',
            paddingTop: 28,
            fontSize: 30,
            color: '#6E6C64',
          }}
        >
          <span>Retrait gratuit ou livraison partout en France</span>
          <span>{BRAND_NAME.toLowerCase()}.fr</span>
        </div>
      </div>
    ),
    size
  )
}
