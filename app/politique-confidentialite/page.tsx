import type { Metadata } from 'next'
import Link from 'next/link'
import LegalPage, { LegalSection } from '@/components/legal/LegalPage'
import ManageCookiesButton from '@/components/ManageCookiesButton'
import { BRAND_NAME } from '@/lib/brand'
import { COMPANY, formatHeadOffice } from '@/lib/company'

export const metadata: Metadata = {
  title: 'Politique de confidentialité',
  description: `Quelles données ${BRAND_NAME} collecte, pourquoi, avec qui elles sont partagées, combien de temps elles sont conservées et comment exercer vos droits.`,
  alternates: { canonical: '/politique-confidentialite' },
  robots: { index: true, follow: true },
}

// Read at render, exactly as /politique-cookies does, so this page
// describes the site as it is actually configured rather than as it was
// planned. With no measurement ID there is no Google Analytics, and
// saying otherwise would be a false statement in a legal notice —
// the kind nobody remembers to come back and correct.
const GA_ENABLED = Boolean(process.env.NEXT_PUBLIC_GA_ID)

function MailLink() {
  return (
    <a
      href={`mailto:${COMPANY.email}`}
      className="text-verdigris-deep underline underline-offset-2 hover:text-ink"
    >
      {COMPANY.email}
    </a>
  )
}

function Ext({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="text-verdigris-deep underline underline-offset-2 hover:text-ink"
    >
      {children}
    </a>
  )
}

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      eyebrow="Politique de confidentialité"
      title="Politique de confidentialité"
      lastUpdated={COMPANY.cgvVersionDate}
      dateLabel="Dernière mise à jour le"
    >
      <LegalSection title="1. Responsable du traitement">
        <p>
          {COMPANY.legalName}, exploitant le site souqify.fr sous la marque {BRAND_NAME},{' '}
          {formatHeadOffice({ withCountry: true })}, SIREN {COMPANY.siren}. Contact pour toute
          question relative à vos données : <MailLink />.
        </p>
      </LegalSection>

      <LegalSection title="2. Données que nous collectons">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            <strong>Commande :</strong> nom, prénom, adresse email, téléphone, adresse de livraison,
            articles achetés, montant, mode de livraison, historique des échanges avec le service
            client.
          </li>
          <li>
            <strong>Paiement :</strong> traité directement par Stripe. Nous ne recevons ni ne
            conservons vos numéros de carte.
          </li>
          <li>
            <strong>Compte client (si vous en créez un) :</strong> votre email et, selon votre mode
            de connexion, un mot de passe que nous ne conservons que sous forme chiffrée et
            irréversible, ou votre identifiant Google. S’y ajoutent les coordonnées que vous
            enregistrez pour préremplir vos commandes (nom, téléphone, adresse) et la liste de vos
            favoris.
          </li>
          <li>
            <strong>Alertes nouveautés (si vous vous y inscrivez) :</strong> votre adresse email et
            les catégories qui vous intéressent. Chaque message contient un lien de désinscription en
            un clic.
          </li>
          <li>
            <strong>Navigation :</strong>{' '}
            {GA_ENABLED ? (
              <>
                avec votre accord uniquement, données de mesure d’audience (pages vues, clics,
                appareil, provenance approximative) via Google Analytics.
              </>
            ) : (
              <>
                une mesure d’audience sans cookie ni identifiant (Vercel Web Analytics), qui ne vous
                reconnaît pas d’une visite à l’autre.
              </>
            )}{' '}
            Les clics sur les liens partenaires sont également comptés de façon anonyme, sans cookie
            ni identifiant. Pour empêcher qu’un script gonfle ces compteurs, votre adresse IP est
            transformée en une empreinte illisible à l’aide d’une clé tirée au hasard qui n’est
            jamais enregistrée : ni l’adresse IP ni l’empreinte ne sont conservées.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Pourquoi nous les utilisons, et sur quelle base">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            Traiter et livrer votre commande, gérer le retrait, les retours et les garanties :
            exécution du contrat.
          </li>
          <li>
            Vous envoyer la confirmation de commande et les informations de suivi : exécution du
            contrat.
          </li>
          <li>
            Gérer votre compte client et vérifier votre adresse email : exécution du contrat, à
            partir du moment où vous choisissez d’en créer un.
          </li>
          <li>Tenir notre comptabilité et respecter nos obligations fiscales : obligation légale.</li>
          <li>Prévenir la fraude au paiement et les abus automatisés du site : intérêt légitime.</li>
          <li>
            Vous envoyer les alertes nouveautés : votre consentement, donné lors de l’inscription et
            retirable à tout moment par le lien de désinscription.
          </li>
          <li>
            Mesurer l’audience du site et améliorer nos contenus :{' '}
            {GA_ENABLED ? (
              <>
                votre consentement, que vous pouvez retirer à tout moment via «&nbsp;Gérer mes
                cookies&nbsp;».
              </>
            ) : (
              <>
                intérêt légitime, l’outil utilisé ne déposant ni cookie ni identifiant et ne
                permettant pas de vous identifier.
              </>
            )}
          </li>
        </ul>
        <p>Nous n’envoyons pas d’emails promotionnels sans votre accord.</p>
      </LegalSection>

      <LegalSection title="4. Destinataires">
        <p>
          Vos données sont accessibles uniquement à {COMPANY.legalName} et aux prestataires
          nécessaires au fonctionnement du service, qui agissent sur nos instructions :
        </p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Stripe (paiement),</li>
          <li>Resend (envoi des emails transactionnels et des alertes nouveautés),</li>
          <li>
            Mondial Relay et Cocolis (livraison, uniquement pour le mode choisi : le transporteur
            reçoit les informations nécessaires à la remise du colis au moment de l’expédition),
          </li>
          <li>Vercel (hébergement du site et mesure d’audience sans cookie),</li>
          <li>MongoDB Atlas (hébergement de la base de données),</li>
          <li>
            Google (connexion avec un compte Google, si vous choisissez ce mode de connexion
            {GA_ENABLED ? ' ; mesure d’audience, seulement si vous l’acceptez' : ''}).
          </li>
        </ul>
        <p>Nous ne vendons pas vos données.</p>
        <p>
          Lorsque vous cliquez sur un lien partenaire (par exemple vers Amazon), vous quittez notre
          site ; le marchand traite alors vos données selon sa propre politique de confidentialité.
        </p>
      </LegalSection>

      <LegalSection title="5. Transferts hors de l’Union européenne">
        <p>
          Certains prestataires (notamment Stripe, Vercel, Resend et Google) peuvent traiter des
          données aux États-Unis. Ces transferts sont encadrés par le Data Privacy Framework
          UE-États-Unis lorsque le prestataire y est certifié, ou par les clauses contractuelles
          types de la Commission européenne.
        </p>
      </LegalSection>

      <LegalSection title="6. Durées de conservation">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            Données de commande et pièces comptables : 10 ans, conformément aux obligations
            comptables.
          </li>
          <li>Échanges avec le service client : 3 ans après le dernier échange.</li>
          <li>Compte client : jusqu’à sa suppression, ou 3 ans après votre dernière activité.</li>
          <li>
            Inscription aux alertes nouveautés : jusqu’à votre désinscription, en un clic depuis
            n’importe lequel de ces emails.
          </li>
          <li>Choix relatifs aux cookies : 6 mois.</li>
          {GA_ENABLED && <li>Données de mesure d’audience : 14 mois maximum.</li>}
        </ul>
      </LegalSection>

      <LegalSection title="7. Vos droits">
        <p>
          Vous disposez d’un droit d’accès, de rectification, d’effacement, de limitation,
          d’opposition et de portabilité de vos données, ainsi que du droit de retirer votre
          consentement à tout moment et de définir des directives sur le sort de vos données après
          votre décès. Écrivez-nous à <MailLink /> ou par courrier à notre siège. Nous répondons dans
          un délai d’un mois.
        </p>
        <p>
          Si vous estimez que vos droits ne sont pas respectés, vous pouvez introduire une
          réclamation auprès de la CNIL (<Ext href="https://www.cnil.fr">www.cnil.fr</Ext>).
        </p>
      </LegalSection>

      <LegalSection title="8. Sécurité">
        <p>
          Les échanges avec le site sont chiffrés (HTTPS). L’accès aux données est limité aux
          personnes qui en ont besoin pour traiter les commandes.
        </p>
      </LegalSection>

      <LegalSection title="9. Cookies">
        <p>
          Le détail des cookies utilisés et la gestion de vos choix figurent sur la page{' '}
          <Link
            href="/politique-cookies"
            className="text-verdigris-deep underline underline-offset-2 hover:text-ink"
          >
            Cookies
          </Link>
          .
        </p>
        <p className="print:hidden">
          <span className="inline-flex rounded-full border border-hairline-strong px-4 py-2 text-sm font-semibold text-ink">
            <ManageCookiesButton />
          </span>
        </p>
      </LegalSection>
    </LegalPage>
  )
}
