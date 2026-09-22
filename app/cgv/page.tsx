import type { Metadata } from 'next'
import Link from 'next/link'
import LegalPage, { LegalSection } from '@/components/legal/LegalPage'
import LegalGuaranteeBox from '@/components/legal/LegalGuaranteeBox'
import WithdrawalForm from '@/components/legal/WithdrawalForm'
import { COMPANY, formatHeadOffice } from '@/lib/company'
import { BRAND_NAME } from '@/lib/brand'

export const metadata: Metadata = {
  title: 'Conditions générales de vente',
  description: `Conditions de vente de ${BRAND_NAME} : produits de déstockage, prix TTC, livraison et retrait à Bondues, droit de rétractation de 14 jours et garanties légales.`,
  alternates: { canonical: '/cgv' },
  robots: { index: true, follow: true },
}

function MailLink() {
  return (
    <a href={`mailto:${COMPANY.email}`} className="text-verdigris-deep hover:underline">
      {COMPANY.email}
    </a>
  )
}

export default function CGVPage() {
  return (
    <LegalPage
      eyebrow="Conditions générales de vente"
      title="Conditions générales de vente"
      lastUpdated={COMPANY.cgvVersionDate}
    >
      <LegalSection title="Article 1. Identification du vendeur">
        <p>
          Le site souqify.fr (ci-après « le Site ») est exploité sous la marque {BRAND_NAME} par{' '}
          {COMPANY.legalName}, société par actions simplifiée au capital de {COMPANY.shareCapital},
          immatriculée au {COMPANY.rcs}, SIRET {COMPANY.siret}, dont le siège social est situé{' '}
          {formatHeadOffice({ withCountry: true })}, numéro de TVA intracommunautaire{' '}
          {COMPANY.vatNumber} (ci-après « le Vendeur »).
        </p>
        <p>
          Contact : <MailLink /> · {COMPANY.phone} · courrier au siège social.
        </p>
      </LegalSection>

      <LegalSection title="Article 2. Champ d’application">
        <p>
          Les présentes conditions générales de vente (CGV) s’appliquent à toute vente conclue sur le
          Site entre le Vendeur et un acheteur agissant en qualité de consommateur (ci-après
          « l’Acheteur »), pour une livraison ou un retrait en France métropolitaine. L’Acheteur
          déclare avoir pris connaissance des CGV et les accepter avant de passer commande, par une
          case à cocher lors de la validation de la commande. Les CGV applicables sont celles en
          vigueur à la date de la commande.
        </p>
      </LegalSection>

      <LegalSection title="Article 3. Produits">
        <p>
          Les produits proposés sont des articles de déstockage : surstocks, fins de série, invendus
          et retours de type « open-box ». Sauf mention contraire, chaque article est vendu à l’unité
          et n’existe qu’en un seul exemplaire.
        </p>
        <p>
          Chaque article est contrôlé avant sa mise en ligne. La fiche produit décrit ses
          caractéristiques essentielles et précise, le cas échéant, les particularités propres à
          l’exemplaire vendu (emballage ouvert ou abîmé, accessoire manquant, défaut esthétique,
          etc.). Les photographies illustrent l’article ; lorsqu’une particularité de l’exemplaire
          est signalée, une photo de cette particularité est jointe dans la mesure du possible. En
          cas de doute sur l’état d’un article, l’Acheteur peut contacter le Vendeur avant de
          commander.
        </p>
        <p>
          Les offres sont valables dans la limite des stocks disponibles. Si un article devient
          indisponible après la commande (vente simultanée d’un exemplaire unique), le Vendeur en
          informe l’Acheteur sans délai et le rembourse intégralement dans un délai de 14 jours au
          plus tard.
        </p>
      </LegalSection>

      <LegalSection title="Article 4. Prix">
        <p>
          Les prix sont indiqués en euros, toutes taxes comprises (TTC), TVA française au taux
          applicable incluse. Les frais de livraison sont indiqués avant la validation de la commande
          et s’ajoutent au prix des produits.
        </p>
        <p>
          Lorsqu’un prix de comparaison est affiché, sa nature est précisée sur la fiche produit (par
          exemple le prix de vente pratiqué par un autre distributeur à la date indiquée). Il ne
          constitue pas une réduction de prix pratiquée par le Vendeur, sauf mention expresse.
        </p>
        <p>
          Le Vendeur peut modifier ses prix à tout moment ; le prix facturé est celui affiché lors de
          la validation de la commande.
        </p>
      </LegalSection>

      <LegalSection title="Article 5. Commande">
        <p>
          L’Acheteur sélectionne les articles, choisit le mode de livraison ou de retrait, vérifie le
          récapitulatif de sa commande et son prix total, puis accepte les CGV et valide la commande
          par le bouton « Commander avec obligation de paiement » (ou formulation équivalente). La
          vente est conclue à la confirmation du paiement. Un email de confirmation récapitulant la
          commande et reprenant les présentes CGV (ou un lien durable vers celles-ci) est envoyé à
          l’Acheteur.
        </p>
        <p>
          Le Vendeur peut refuser une commande en cas de litige existant avec l’Acheteur ou de
          suspicion de fraude.
        </p>
      </LegalSection>

      <LegalSection title="Article 6. Paiement">
        <p>
          Le paiement s’effectue en ligne par carte bancaire via la solution sécurisée Stripe. Le
          montant est débité lors de la validation de la commande. Le Vendeur n’a pas accès aux
          données bancaires de l’Acheteur.
        </p>
      </LegalSection>

      <LegalSection title="Article 7. Livraison et retrait">
        <p>Trois modes sont proposés :</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            retrait gratuit à l’entrepôt de Bondues (59910), sur rendez-vous, {COMPANY.pickup.hours}.
            Délai : {COMPANY.deliveryDelays.pickup} ;
          </li>
          <li>
            livraison en point relais Mondial Relay. Délai indicatif :{' '}
            {COMPANY.deliveryDelays.mondialRelay} ;
          </li>
          <li>
            livraison à domicile par Cocolis. Délai indicatif : {COMPANY.deliveryDelays.cocolis}.
          </li>
        </ul>
        <p>
          Le mode choisi, son coût et la date ou le délai de livraison sont indiqués avant la
          validation de la commande. À défaut d’indication, la livraison intervient au plus tard 30
          jours après la conclusion du contrat.
        </p>
        <p>
          En cas de retard, l’Acheteur peut, après avoir enjoint le Vendeur par écrit de livrer dans
          un délai supplémentaire raisonnable, résoudre le contrat si la livraison n’intervient pas
          dans ce délai, conformément aux articles L216-2 et suivants du Code de la consommation. Il
          est alors remboursé de la totalité des sommes versées au plus tard dans les 14 jours.
        </p>
        <p>
          Le risque de perte ou d’endommagement des produits est transféré à l’Acheteur au moment où
          il prend physiquement possession des produits, ou un tiers désigné par lui.
        </p>
        <p>
          Il est recommandé à l’Acheteur de vérifier l’état du colis à la réception et de signaler
          toute anomalie au transporteur et au Vendeur. Cette vérification ne prive pas l’Acheteur de
          ses droits légaux.
        </p>
        <p>
          En cas de retrait, l’Acheteur dispose de {COMPANY.pickupBookingDays} jours après la
          confirmation de commande pour fixer un rendez-vous ; passé ce délai et après relance restée
          sans réponse, le Vendeur peut annuler la commande et rembourser l’Acheteur.
        </p>
      </LegalSection>

      <LegalSection title="Article 8. Droit de rétractation">
        <p>
          <strong>8.1 Délai.</strong> L’Acheteur dispose d’un délai de 14 jours pour se rétracter,
          sans motif ni pénalité. Ce délai court à compter de la prise de possession physique du bien
          par l’Acheteur (y compris lors d’un retrait à l’entrepôt). Pour une commande de plusieurs
          biens livrés séparément, il court à compter de la réception du dernier bien.
        </p>
        <p>
          <strong>8.2 Exercice.</strong> L’Acheteur notifie sa décision avant l’expiration du délai,
          au moyen du formulaire de rétractation figurant en annexe (également disponible sur la page{' '}
          <Link href="/retractation" className="text-verdigris-deep hover:underline">
            /retractation
          </Link>
          ) ou de toute autre déclaration dénuée d’ambiguïté, par email à <MailLink /> ou par courrier
          au siège social.
        </p>
        <p>
          <strong>8.3 Retour du bien.</strong> L’Acheteur renvoie ou rapporte le bien au Vendeur au
          plus tard 14 jours après avoir communiqué sa décision. Il peut également le rapporter à
          l’entrepôt de Bondues sur rendez-vous. Les frais directs de renvoi sont à la charge de
          l’Acheteur. Pour les biens qui, en raison de leur taille ou de leur poids, ne peuvent
          normalement être renvoyés par la poste, le coût estimé du renvoi est de{' '}
          {COMPANY.bulkyReturnCost} € ; ce coût est indiqué sur la fiche produit concernée.
        </p>
        <p>
          <strong>8.4 Remboursement.</strong> Le Vendeur rembourse la totalité des sommes versées,
          frais de livraison initiaux inclus (dans la limite du mode de livraison standard le moins
          coûteux proposé), au plus tard 14 jours après avoir été informé de la décision de
          rétractation. Le Vendeur peut différer le remboursement jusqu’à la récupération du bien ou
          jusqu’à ce que l’Acheteur ait fourni une preuve de l’expédition du bien, la date retenue
          étant celle du premier de ces faits. Le remboursement est effectué par le même moyen de
          paiement que celui utilisé pour la commande.
        </p>
        <p>
          <strong>8.5 Dépréciation.</strong> La responsabilité de l’Acheteur peut être engagée en cas
          de dépréciation du bien résultant de manipulations autres que celles nécessaires pour
          établir la nature, les caractéristiques et le bon fonctionnement du bien. L’état initial de
          l’exemplaire décrit sur la fiche produit sert de référence.
        </p>
      </LegalSection>

      <LegalSection title="Article 9. Garanties légales">
        <p>
          Tous les produits, y compris les articles de déstockage et open-box, bénéficient de plein
          droit de la garantie légale de conformité (articles L217-1 et suivants du Code de la
          consommation) et de la garantie légale des vices cachés (articles 1641 à 1649 du Code
          civil). Les particularités de l’exemplaire expressément signalées sur la fiche produit
          avant l’achat ne constituent pas un défaut de conformité.
        </p>
        <LegalGuaranteeBox />
        <p>
          Pour mettre en œuvre une garantie, l’Acheteur contacte le Vendeur à <MailLink /> en
          décrivant le défaut, si possible avec photos.
        </p>
      </LegalSection>

      <LegalSection title="Article 10. Responsabilité">
        <p>
          Le Vendeur n’est pas responsable des dommages résultant d’une utilisation du produit non
          conforme à sa destination ou aux instructions du fabricant, ni de l’inexécution due à un
          cas de force majeure. Cette clause ne limite en rien les garanties légales ni la
          responsabilité du Vendeur envers un consommateur telle que prévue par la loi.
        </p>
      </LegalSection>

      <LegalSection title="Article 11. Données personnelles">
        <p>
          Les données collectées lors de la commande sont traitées par {COMPANY.legalName} pour
          l’exécution de la commande et le respect des obligations légales. Leur traitement est
          décrit dans la Politique de confidentialité, accessible depuis chaque page du Site.
          L’Acheteur peut exercer ses droits à <MailLink />.
        </p>
      </LegalSection>

      <LegalSection title="Article 12. Réclamations et médiation">
        <p>
          Toute réclamation est adressée au service client à <MailLink />. En cas d’échec de la
          réclamation écrite, l’Acheteur peut recourir gratuitement au médiateur de la consommation
          dont relève le Vendeur : {COMPANY.mediator.name}, {COMPANY.mediator.address},{' '}
          {COMPANY.mediator.website}.
        </p>
      </LegalSection>

      <LegalSection title="Article 13. Droit applicable">
        <p>
          Les présentes CGV sont soumises au droit français. À défaut de résolution amiable, le
          litige est porté devant la juridiction compétente selon les règles de droit commun ; le
          consommateur peut notamment saisir la juridiction du lieu où il demeurait au moment de la
          conclusion du contrat ou de la survenance du fait dommageable.
        </p>
      </LegalSection>

      <LegalSection title="Annexe. Formulaire de rétractation">
        <WithdrawalForm />
      </LegalSection>
    </LegalPage>
  )
}
