import type { Metadata } from 'next'
import Link from 'next/link'
import { Mail } from 'lucide-react'
import LegalPage, { LegalSection } from '@/components/legal/LegalPage'
import WithdrawalForm from '@/components/legal/WithdrawalForm'
import { COMPANY, formatHeadOffice } from '@/lib/company'
import { BRAND_NAME } from '@/lib/brand'

export const metadata: Metadata = {
  title: 'Droit de rétractation',
  description: `Comment annuler une commande ${BRAND_NAME} sous 14 jours : délai, marche à suivre, remboursement et formulaire de rétractation à renvoyer.`,
  alternates: { canonical: '/retractation' },
  robots: { index: true, follow: true },
}

// A prefilled draft, not a submission. The buyer still sends it from
// their own mailbox, which is what gives them a dated, provable record of
// having notified the seller in time. That record is the whole point of
// the 14-day deadline, so it should live somewhere they control.
const MAILTO = (() => {
  const subject = 'Rétractation, commande n° '
  const body = [
    `À l’attention de ${COMPANY.legalName} (${BRAND_NAME}), ${formatHeadOffice({ withCountry: true })} :`,
    '',
    'Je vous notifie par la présente ma rétractation du contrat portant sur la vente du bien ci-dessous :',
    '',
    'Commandé le / reçu le : ',
    'Numéro de commande : ',
    'Nom : ',
    'Adresse : ',
    'Date : ',
  ].join('\n')
  return `mailto:${COMPANY.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
})()

export default function RetractationPage() {
  return (
    <LegalPage
      eyebrow="Droit de rétractation"
      title="Droit de rétractation"
      lastUpdated={COMPANY.cgvVersionDate}
      dateLabel="Mise à jour le"
      intro={
        <p>
          Vous avez 14 jours pour changer d’avis, sans avoir à vous justifier et sans pénalité. Cette
          page explique comment, et met à votre disposition le formulaire officiel. Les modalités
          complètes figurent à l’article 8 des{' '}
          <Link href="/cgv" className="text-verdigris-deep underline underline-offset-2 hover:text-ink">
            conditions générales de vente
          </Link>
          .
        </p>
      }
    >
      <LegalSection title="Le délai">
        <p>
          Le délai de 14 jours court à compter du jour où vous prenez physiquement possession du
          bien, retrait à l’entrepôt compris. Si votre commande comporte plusieurs biens livrés
          séparément, il court à compter de la réception du dernier.
        </p>
      </LegalSection>

      <LegalSection title="Comment nous prévenir">
        <p>
          Envoyez-nous votre décision avant la fin du délai, par email à{' '}
          <a href={`mailto:${COMPANY.email}`} className="text-verdigris-deep underline underline-offset-2 hover:text-ink">
            {COMPANY.email}
          </a>{' '}
          ou par courrier au siège social, {formatHeadOffice({ withCountry: true })}. Vous pouvez
          utiliser le formulaire ci-dessous, ou toute autre déclaration dénuée d’ambiguïté.
        </p>
        <p className="print:hidden">
          <a
            href={MAILTO}
            className="mt-2 inline-flex items-center gap-2 rounded-full bg-verdigris px-6 py-3 text-sm font-semibold text-stone transition-colors hover:bg-verdigris-deep"
          >
            <Mail aria-hidden className="h-4 w-4" />
            Ouvrir un email de rétractation prérempli
          </a>
        </p>
        <p className="text-sm text-dust print:hidden">
          Le brouillon s’ouvre dans votre messagerie. Complétez le numéro de commande et les dates,
          puis envoyez. Gardez l’email envoyé : il date votre demande.
        </p>
      </LegalSection>

      <LegalSection title="Renvoyer le bien">
        <p>
          Renvoyez ou rapportez le bien au plus tard 14 jours après nous avoir communiqué votre
          décision. Vous pouvez aussi le rapporter à l’entrepôt de Bondues sur rendez-vous. Les frais
          directs de renvoi sont à votre charge. Pour les biens qui, en raison de leur taille ou de
          leur poids, ne peuvent normalement pas être renvoyés par la poste, le coût estimé du renvoi
          est de {COMPANY.bulkyReturnCost} € ; il est indiqué sur la fiche produit concernée.
        </p>
      </LegalSection>

      <LegalSection title="Votre remboursement">
        <p>
          Nous vous remboursons la totalité des sommes versées, frais de livraison initiaux inclus
          dans la limite du mode de livraison standard le moins coûteux proposé, au plus tard 14
          jours après avoir été informés de votre décision. Nous pouvons différer le remboursement
          jusqu’à la récupération du bien, ou jusqu’à ce que vous ayez fourni une preuve de son
          expédition, la première de ces deux dates étant retenue. Le remboursement est effectué par
          le moyen de paiement utilisé pour la commande.
        </p>
        <p>
          Votre responsabilité peut être engagée en cas de dépréciation du bien résultant de
          manipulations autres que celles nécessaires pour en établir la nature, les caractéristiques
          et le bon fonctionnement. L’état de l’exemplaire décrit sur sa fiche produit sert de
          référence.
        </p>
      </LegalSection>

      <LegalSection title="Formulaire de rétractation">
        <WithdrawalForm />
      </LegalSection>
    </LegalPage>
  )
}
