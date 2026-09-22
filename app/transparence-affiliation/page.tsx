import type { Metadata } from 'next'
import Link from 'next/link'
import LegalPage, { LegalSection } from '@/components/legal/LegalPage'
import { BRAND_NAME } from '@/lib/brand'
import { COMPANY } from '@/lib/company'

export const metadata: Metadata = {
  title: 'Transparence & affiliation',
  description: `Ce que ${BRAND_NAME} vend lui-même, ce qu’il recommande en lien partenaire, et comment les commissions fonctionnent. Sans surcoût pour vous.`,
  alternates: { canonical: '/transparence-affiliation' },
  robots: { index: true, follow: true },
}

export default function TransparenceAffiliationPage() {
  return (
    <LegalPage
      eyebrow="Transparence & affiliation"
      title="Transparence & affiliation"
      lastUpdated={COMPANY.cgvVersionDate}
      dateLabel="Mise à jour le"
    >
      <LegalSection title="Ce que nous vendons">
        <p>
          {BRAND_NAME} vend ses propres articles de déstockage, expédiés depuis Bondues. Dans nos{' '}
          <Link href="/guides" className="text-verdigris-deep hover:underline">
            guides
          </Link>
          , nous recommandons aussi parfois des produits que nous ne vendons pas, lorsqu’ils
          répondent mieux à un besoin (taille, usage, budget) que ce que nous avons en stock.
        </p>
      </LegalSection>

      <LegalSection title="Comment les liens partenaires sont signalés">
        <p>
          Ces recommandations sont signalées par le badge « Lien partenaire ». Si vous achetez via
          ces liens, nous pouvons percevoir une commission, sans surcoût pour vous. L’achat est alors
          conclu avec le marchand concerné (par exemple Amazon), selon ses propres conditions de
          vente, de livraison et de retour. {BRAND_NAME} n’est pas le vendeur de ces produits.
        </p>
        <p>
          En tant que Partenaire Amazon, je réalise un bénéfice sur les achats remplissant les
          conditions requises.
        </p>
      </LegalSection>

      <LegalSection title="Ce que la commission ne change pas">
        <p>
          Les commissions n’influencent pas le choix des produits : un produit {BRAND_NAME} et un
          produit partenaire sont présentés selon les mêmes critères, avec leurs avantages et leurs
          limites.
        </p>
      </LegalSection>
    </LegalPage>
  )
}
