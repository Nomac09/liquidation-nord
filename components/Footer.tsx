import Link from 'next/link'
import { BRAND_NAME, BRAND_SYLLABLE_SPLIT } from '@/lib/brand'

export default function Footer() {
  return (
    <footer className="border-t border-ligne bg-encre text-blanc">
      <div className="container mx-auto grid gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-display text-lg font-bold">
            {BRAND_SYLLABLE_SPLIT.lead}<span className="text-orange">{BRAND_SYLLABLE_SPLIT.tail}</span>
          </p>
          <p className="mt-2 text-sm leading-relaxed text-blanc/70">
            Déstockage de retours vidaXL : mobilier, jardin, bricolage et déco
            à moitié prix. Chaque pièce est unique — quand c’est parti, c’est parti.
          </p>
        </div>

        <div>
          <p className="tag-label text-blanc/50">Entrepôt</p>
          <address className="mt-3 text-sm not-italic leading-relaxed text-blanc/85">
            Bondues (59910), Nord
            <br />
            Retrait gratuit sur rendez-vous
            <br />
            Lun–Sam · 9h–18h
          </address>
        </div>

        <div>
          <p className="tag-label text-blanc/50">Livraison</p>
          <ul className="mt-3 space-y-1.5 text-sm text-blanc/85">
            <li>Retrait entrepôt — gratuit</li>
            <li>Point relais Mondial Relay — 29,99 €</li>
            <li>À domicile par Cocolis — 79,99 €</li>
          </ul>
        </div>

        <div>
          <p className="tag-label text-blanc/50">Boutique</p>
          <ul className="mt-3 space-y-1.5 text-sm">
            <li>
              <Link href="/" className="text-blanc/85 hover:text-blanc">
                Tout l’arrivage
              </Link>
            </li>
            <li>
              <Link href="/?category=Mobilier" className="text-blanc/85 hover:text-blanc">
                Mobilier
              </Link>
            </li>
            <li>
              <Link href="/?category=Bazar" className="text-blanc/85 hover:text-blanc">
                Bazar & Déco
              </Link>
            </li>
            <li>
              <Link href="/cart" className="text-blanc/85 hover:text-blanc">
                Mon panier
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-blanc/10">
        <div className="container mx-auto flex flex-col items-start justify-between gap-2 px-4 py-4 font-mono text-[11px] uppercase tracking-widest text-blanc/50 sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} {BRAND_NAME} — souqify.fr</p>
          <p>Paiement sécurisé Stripe · TVA non applicable, art. 293 B du CGI</p>
        </div>
      </div>
    </footer>
  )
}
