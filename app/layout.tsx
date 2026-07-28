import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { IBM_Plex_Mono, Ibarra_Real_Nova, Karla } from 'next/font/google'
import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import CartDrawer from '@/components/CartDrawer'
import CookieNotice from '@/components/CookieNotice'
import SessionProvider from '@/components/SessionProvider'
import FavoritesHydrator from '@/components/FavoritesHydrator'
import StockManifest from '@/components/StockManifest'
import FilterBar from '@/components/FilterBar'
import { getCategoryCounts } from '@/lib/catalog'
import { BRAND_NAME } from '@/lib/brand'

const mono = IBM_Plex_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500', '600'],
})

// The "quiet premium" identity, sitewide — Bricolage Grotesque and Archivo
// are fully retired (see tailwind.config.ts: `display`/`sans` now point at
// these same two fonts, so no component needed to change its className).
const serif = Ibarra_Real_Nova({
  subsets: ['latin'],
  variable: '--font-serif',
  weight: ['400', '600'],
  style: ['normal', 'italic'],
})

const karla = Karla({
  subsets: ['latin'],
  variable: '--font-karla',
  weight: ['400', '500', '600', '700'],
})

export const metadata: Metadata = {
  metadataBase: new URL('https://www.souqify.fr'),
  title: {
    default: `${BRAND_NAME} — Mobilier & déco vidaXL à −50 %`,
    template: `%s — ${BRAND_NAME}`,
  },
  description:
    'Jardin, mobilier, déco et jardinage vidaXL à Bondues (59), à moitié prix. Retrait gratuit ou livraison partout en France.',
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    siteName: BRAND_NAME,
  },
  twitter: {
    card: 'summary',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const counts = await getCategoryCounts()

  return (
    <html lang="fr" className={`${mono.variable} ${serif.variable} ${karla.variable}`}>
      <body className="font-sans flex min-h-screen flex-col">
        <SessionProvider>
          <FavoritesHydrator />
          <Header />
          <div className="sticky top-[60px] z-30 sm:top-[65px]">
            <StockManifest counts={counts} />
          </div>
          <FilterBar />
          <main className="flex-1">{children}</main>
          <Footer />
          <CartDrawer />
          <CookieNotice />
        </SessionProvider>
        <Analytics />
      </body>
    </html>
  )
}
