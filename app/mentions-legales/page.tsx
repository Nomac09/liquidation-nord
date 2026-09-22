import type { Metadata } from 'next'
import Link from 'next/link'
import LegalPage, { LegalSection } from '@/components/legal/LegalPage'
import { COMPANY, formatHeadOffice, formatPhone, phoneHref } from '@/lib/company'
import { BRAND_NAME } from '@/lib/brand'

export const metadata: Metadata = {
  title: 'Mentions légales',
  description: `Éditeur, hébergeur, directeur de la publication et médiation de la consommation du site souqify.fr, exploité par ${COMPANY.legalName}.`,
  alternates: { canonical: '/mentions-legales' },
  robots: { index: true, follow: true },
}

export default function MentionsLegalesPage() {
  return (
    <LegalPage
      eyebrow="Mentions légales"
      title="Mentions légales"
      lastUpdated={COMPANY.cgvVersionDate}
      dateLabel="Mises à jour le"
    >
      <LegalSection title="Éditeur du site">
        <p>
          Le site souqify.fr est édité par {COMPANY.legalName}, société par actions simplifiée au
          capital de {COMPANY.shareCapital}, immatriculée au {COMPANY.rcs}, SIRET {COMPANY.siret}.
        </p>
        <p>Siège social : {formatHeadOffice({ withCountry: true })}.</p>
        <p>Numéro de TVA intracommunautaire : {COMPANY.vatNumber}.</p>
        <p>
          Email :{' '}
          <a href={`mailto:${COMPANY.email}`} className="text-verdigris-deep underline underline-offset-2 hover:text-ink">
            {COMPANY.email}
          </a>{' '}
          ·{' '}
          <a href={phoneHref()} className="text-verdigris-deep underline underline-offset-2 hover:text-ink">
            Téléphone : {formatPhone()}
          </a>
          .
        </p>
        <p>
          {BRAND_NAME} est une marque commerciale exploitée par {COMPANY.legalName}.
        </p>
      </LegalSection>

      <LegalSection title="Directeur de la publication">
        <p>{COMPANY.publicationDirector}.</p>
      </LegalSection>

      <LegalSection title="Hébergement">
        <p>
          {COMPANY.host.name}, {COMPANY.host.address},{' '}
          <a
            href={COMPANY.host.website}
            target="_blank"
            rel="noopener noreferrer"
            className="text-verdigris-deep underline underline-offset-2 hover:text-ink"
          >
            {COMPANY.host.website}
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection title="Propriété intellectuelle">
        <p>
          Les textes, guides, photographies réalisées par {BRAND_NAME} et la mise en page du site
          sont la propriété d’{COMPANY.legalName}. Toute reproduction sans autorisation est
          interdite. Les marques et noms de produits de tiers cités sur le site (dont vidaXL et
          Amazon) appartiennent à leurs propriétaires respectifs ; leur mention sert uniquement à
          identifier les produits. {BRAND_NAME} n’est ni affilié à vidaXL, ni partenaire officiel de
          cette marque.
        </p>
      </LegalSection>

      <LegalSection title="Liens partenaires">
        <p>
          Certains contenus du site contiennent des liens partenaires. Voir la page{' '}
          <Link href="/transparence-affiliation" className="text-verdigris-deep underline underline-offset-2 hover:text-ink">
            Transparence &amp; affiliation
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection title="Données personnelles">
        <p>
          Voir la Politique de confidentialité et la{' '}
          <Link href="/politique-cookies" className="text-verdigris-deep underline underline-offset-2 hover:text-ink">
            Politique cookies
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection title="Médiation de la consommation">
        <p>
          {COMPANY.mediator.name}, {COMPANY.mediator.address}, {COMPANY.mediator.website}.
        </p>
      </LegalSection>
    </LegalPage>
  )
}
