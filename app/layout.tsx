import type { Metadata } from 'next'
import { Bricolage_Grotesque, Archivo, IBM_Plex_Mono } from 'next/font/google'
import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import CartDrawer from '@/components/CartDrawer'
import SessionProvider from '@/components/SessionProvider'
import FavoritesHydrator from '@/components/FavoritesHydrator'
import StockManifest from '@/components/StockManifest'
import FilterBar from '@/components/FilterBar'
import { getCategoryCounts } from '@/lib/catalog'
import { BRAND_NAME } from '@/lib/brand'

const display = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['600', '700', '800'],
})

const body = Archivo({
  subsets: ['latin'],
  variable: '--font-body',
})

const mono = IBM_Plex_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500', '600'],
})

export const metadata: Metadata = {
  metadataBase: new URL('https://www.souqify.fr'),
  title: {
    default: `${BRAND_NAME} — Mobilier & déco vidaXL à −50 %`,
    template: `%s — ${BRAND_NAME}`,
  },
  description:
    'Jardin, mobilier, déco et jardinage vidaXL à Bondues (59), à moitié prix. Chaque pièce est en stock limité — retrait gratuit ou livraison partout en France.',
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
    <html lang="fr" className={`${display.variable} ${body.variable} ${mono.variable}`}>
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
        </SessionProvider>
      </body>
    </html>
  )
}
