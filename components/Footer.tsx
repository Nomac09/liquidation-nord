import Link from 'next/link'
import { BRAND_NAME, BRAND_SYLLABLE_SPLIT } from '@/lib/brand'
import { CATEGORIES } from '@/lib/categories'
import {
  COMPANY,
  PRICE_NOTICE,
  VIDAXL_DISCLAIMER,
  formatHeadOffice,
} from '@/lib/company'
import { RELAY_BANDS, HOME_BANDS } from '@/lib/shipping'
import ManageCookiesButton from '@/components/ManageCookiesButton'

// The statutory links, in the order the spec fixes them.
//
// "Confidentialité" is missing on purpose. It belongs here, pointing at
// /politique-confidentialite, but that page is deliberately not written
// in this phase: it needs genuinely new legal text rather than a
// rearrangement of the cookie table (docs/PHASE1_AUDIT.md §4.1 lists the
// eleven mandatory items it is missing). Linking it now would put a 404
// in the footer of every page, and re-labelling the cookie policy as a
// privacy policy would be the same misstatement in a nicer font. It goes
// in the moment the page exists.
const LEGAL_LINKS = [
  { href: '/mentions-legales', label: 'Mentions légales' },
  { href: '/cgv', label: 'CGV' },
  { href: '/politique-cookies', label: 'Cookies' },
  { href: '/transparence-affiliation', label: 'Transparence & affiliation' },
  { href: '/retractation', label: 'Rétractation' },
]

// "à partir de", not a flat price: both carriers are weight-banded in
// lib/shipping.ts, and quoting only the cheapest band as if it were the
// price contradicts the checkout two clicks later, and CGV art. 4.
const relayFrom = RELAY_BANDS[0].price
const homeFrom = HOME_BANDS[0].price

function formatFrom(price: number) {
  return price.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// A fixed dark plinth, deliberately not theme-reactive — an anchor at the
// foot of every page regardless of the visitor's light/dark preference,
// the same way a magazine's colophon page holds its own ground.
export default function Footer() {
  return (
    <footer className="border-t border-[#383B33] bg-[#22221F] text-[#F6F5F1] print:hidden">
      <div className="container mx-auto grid gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-5">
        <div>
          <p className="font-display text-lg italic">
            {BRAND_SYLLABLE_SPLIT.lead}<span className="text-[#9BB08D]">{BRAND_SYLLABLE_SPLIT.tail}</span>
          </p>
          <p className="mt-2 text-sm leading-relaxed text-[#F6F5F1]/70">
            Surstocks et retours open-box à moitié prix, dont des articles vidaXL.
            Retrait gratuit à Bondues (59).
          </p>
        </div>

        <div>
          <p className="font-mono text-micro uppercase tracking-widest text-[#F6F5F1]/50">Entrepôt</p>
          <address className="mt-3 text-sm not-italic leading-relaxed text-[#F6F5F1]/85">
            {COMPANY.pickup.label}
            <br />
            Retrait gratuit sur rendez-vous
            <br />
            {COMPANY.pickup.hours}
          </address>
        </div>

        <div>
          <p className="font-mono text-micro uppercase tracking-widest text-[#F6F5F1]/50">Contact</p>
          <p className="mt-3 text-sm leading-relaxed text-[#F6F5F1]/85">
            <a href={`mailto:${COMPANY.email}`} className="hover:text-[#F6F5F1]">
              {COMPANY.email}
            </a>
          </p>
        </div>

        <div>
          <p className="font-mono text-micro uppercase tracking-widest text-[#F6F5F1]/50">Livraison</p>
          <ul className="mt-3 space-y-1.5 text-sm text-[#F6F5F1]/85">
            <li>Retrait entrepôt, gratuit</li>
            <li>Point relais Mondial Relay, à partir de {formatFrom(relayFrom)} €</li>
            <li>À domicile par Cocolis, à partir de {formatFrom(homeFrom)} €</li>
          </ul>
        </div>

        <div>
          <p className="font-mono text-micro uppercase tracking-widest text-[#F6F5F1]/50">Boutique</p>
          <ul className="mt-3 space-y-1.5 text-sm">
            <li>
              <Link href="/" className="text-[#F6F5F1]/85 hover:text-[#F6F5F1]">
                Toute la collection
              </Link>
            </li>
            {CATEGORIES.map((c) => (
              <li key={c.value}>
                <Link href={`/?category=${encodeURIComponent(c.value)}`} className="text-[#F6F5F1]/85 hover:text-[#F6F5F1]">
                  {c.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/guides" className="text-[#F6F5F1]/85 hover:text-[#F6F5F1]">
                Guides
              </Link>
            </li>
            <li>
              <Link href="/cart" className="text-[#F6F5F1]/85 hover:text-[#F6F5F1]">
                Mon panier
              </Link>
            </li>
          </ul>
        </div>
      </div>

      {/*
        The legal plinth. Set in normal case rather than the uppercase
        mono the rest of the footer uses: a SIREN, a VAT number and a
        postal address are read character by character when they are read
        at all, and letter-spaced caps make that measurably harder.
      */}
      <div className="border-t border-[#F6F5F1]/10">
        <div className="container mx-auto space-y-2 px-4 py-5 text-[12px] leading-relaxed text-[#F6F5F1]/55">
          <p>
            © {new Date().getFullYear()} {BRAND_NAME}, marque exploitée par {COMPANY.legalName}
          </p>
          <p>
            SIREN {COMPANY.siren} · TVA {COMPANY.vatNumber} · Siège : {formatHeadOffice()}
          </p>
          <nav aria-label="Informations légales">
            <ul className="flex flex-wrap items-center gap-x-3 gap-y-1">
              {LEGAL_LINKS.map((link, i) => (
                <li key={link.href} className="flex items-center gap-3">
                  {i > 0 && <span aria-hidden className="text-[#F6F5F1]/25">·</span>}
                  <Link href={link.href} className="hover:text-[#F6F5F1] hover:underline">
                    {link.label}
                  </Link>
                </li>
              ))}
              <li className="flex items-center gap-3">
                <span aria-hidden className="text-[#F6F5F1]/25">·</span>
                <ManageCookiesButton />
              </li>
            </ul>
          </nav>
          <p>{PRICE_NOTICE}</p>
          <p className="text-[#F6F5F1]/45">{VIDAXL_DISCLAIMER}</p>
        </div>
      </div>
    </footer>
  )
}
