import type { Metadata } from 'next'
import { Bricolage_Grotesque, Archivo, IBM_Plex_Mono } from 'next/font/google'
import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import CartDrawer from '@/components/CartDrawer'
import SessionProvider from '@/components/SessionProvider'
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
    'Mobilier, jardin, bricolage et déco vidaXL à Bondues (59), à moitié prix. Chaque pièce est en stock limité — retrait gratuit ou livraison partout en France.',
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    siteName: BRAND_NAME,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body className="font-sans flex min-h-screen flex-col">
        <SessionProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <CartDrawer />
        </SessionProvider>
      </body>
    </html>
  )
}
