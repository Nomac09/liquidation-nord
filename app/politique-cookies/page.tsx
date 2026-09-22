import type { Metadata } from 'next'
import LegalPage, { LegalSection } from '@/components/legal/LegalPage'
import ManageCookiesButton from '@/components/ManageCookiesButton'
import { BRAND_NAME } from '@/lib/brand'
import { COMPANY } from '@/lib/company'

export const metadata: Metadata = {
  title: 'Politique de cookies',
  description: `Quels cookies souqify.fr dépose, lesquels nécessitent votre accord, et comment changer d’avis à tout moment.`,
  alternates: { canonical: '/politique-cookies' },
  robots: { index: true, follow: true },
}

// Read at render, so this page describes the site as it is actually
// configured. The previous version stated flatly that Google Analytics
// was not used; the moment a measurement ID exists that becomes a false
// statement in a legal notice, which is exactly the kind of thing nobody
// remembers to come back and fix.
const GA_ENABLED = Boolean(process.env.NEXT_PUBLIC_GA_ID)

function Table({ rows }: { rows: { name: string; purpose: string; duration: string }[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-hairline">
      <table className="w-full text-sm">
        <thead className="bg-paper text-left">
          <tr>
            <th scope="col" className="px-4 py-2.5 font-semibold text-ink">Nom</th>
            <th scope="col" className="px-4 py-2.5 font-semibold text-ink">Finalité</th>
            <th scope="col" className="px-4 py-2.5 font-semibold text-ink">Durée</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-hairline">
          {rows.map((r) => (
            <tr key={r.name}>
              <td className="px-4 py-2.5 font-mono text-xs text-ink">{r.name}</td>
              <td className="px-4 py-2.5 text-ink/85">{r.purpose}</td>
              <td className="px-4 py-2.5 text-dust">{r.duration}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function CookiePolicyPage() {
  return (
    <LegalPage
      eyebrow="Politique de cookies"
      title="Politique de cookies"
      lastUpdated={COMPANY.cgvVersionDate}
      dateLabel="Mise à jour le"
    >
      <LegalSection title="Ce que nous n’utilisons pas">
        <p>
          {BRAND_NAME} n’utilise aucun cookie publicitaire, aucun cookie de traçage entre sites, et
          aucun outil de reciblage publicitaire (Meta Pixel, Google Ads ou équivalent). Nous ne
          revendons aucune donnée de navigation.
        </p>
      </LegalSection>

      <LegalSection title="Cookies strictement nécessaires">
        <p>
          Ces cookies sont indispensables au fonctionnement du site : connexion à votre compte,
          panier, paiement. Conformément à l’article 82 de la loi Informatique et Libertés, ils sont
          dispensés de consentement, et il n’est donc pas possible de les refuser tout en utilisant
          le site.
        </p>
        <Table
          rows={[
            {
              name: 'authjs.session-token',
              purpose: 'Vous garder connecté(e) à votre compte',
              duration: '30 jours',
            },
            {
              name: 'authjs.csrf-token',
              purpose: 'Protection contre la falsification de requêtes lors de la connexion',
              duration: 'Session',
            },
            {
              name: 'authjs.callback-url',
              purpose: 'Vous ramener à la bonne page après une connexion',
              duration: 'Session',
            },
            {
              name: '__stripe_mid / __stripe_sid',
              purpose: 'Déposés par Stripe pendant le paiement, pour la prévention de la fraude',
              duration: 'Jusqu’à 1 an / 30 minutes',
            },
          ]}
        />
        <p className="text-sm text-dust">
          Si vous choisissez de vous connecter avec Google, Google dépose ses propres cookies le
          temps de cette connexion. Nous ne les contrôlons pas ; leur politique est disponible sur{' '}
          <a
            href="https://policies.google.com/privacy"
            target="_blank"
            rel="noreferrer"
            className="text-verdigris-deep underline underline-offset-2 hover:text-ink"
          >
            policies.google.com
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection title="Stockage local (pas des cookies)">
        <p>
          Certaines informations sont conservées dans votre navigateur (localStorage et
          sessionStorage), jamais transmises à un serveur tiers : le contenu de votre panier, votre
          mode d’affichage préféré (Galerie ou Liste), votre position de défilement dans la liste
          des pièces, votre choix concernant les cookies de mesure d’audience, et, le temps du
          paiement, la session Stripe en cours. Rien de tout cela ne sert à vous suivre d’un site à
          l’autre.
        </p>
      </LegalSection>

      <LegalSection title="Mesure d’audience sans cookie">
        <p>
          Nous utilisons Vercel Web Analytics pour savoir quelles pages sont consultées et estimer
          la fréquentation du site. Cet outil ne dépose ni cookie ni identifiant persistant sur
          votre appareil, ne vous reconnaît pas d’une visite à l’autre, et ne permet pas de vous
          identifier personnellement. Les données agrégées (pages vues, provenance, pays) sont
          traitées par Vercel Inc., notre hébergeur. À ce titre, il est dispensé de consentement.
        </p>
      </LegalSection>

      {GA_ENABLED && (
        <LegalSection title="Mesure d’audience Google Analytics (soumise à votre accord)">
          <p>
            Nous utilisons également Google Analytics 4 pour comprendre comment le site est utilisé.
            Contrairement à l’outil ci-dessus, il dépose des cookies et nécessite donc votre accord
            préalable.
          </p>
          <p>
            Rien n’est déposé, et le script de Google n’est même pas chargé, tant que vous n’avez
            pas accepté. Si vous refusez, ou si vous ne répondez pas au bandeau, aucun cookie de
            mesure n’est déposé et votre navigation reste strictement identique. La publicité
            personnalisée est désactivée dans tous les cas.
          </p>
          <Table
            rows={[
              {
                name: '_ga',
                purpose: 'Distinguer les visiteurs pour compter les visites (Google Analytics)',
                duration: '13 mois',
              },
              {
                name: '_ga_*',
                purpose: 'Maintenir l’état de la session de mesure (Google Analytics)',
                duration: '13 mois',
              },
            ]}
          />
          <p>
            Ces données sont traitées par Google Ireland Limited, susceptible de les transférer hors
            de l’Union européenne dans le cadre du Data Privacy Framework.
          </p>
        </LegalSection>
      )}

      <LegalSection title="Changer d’avis">
        <p>
          Vous pouvez modifier votre choix à tout moment, aussi simplement que vous l’avez fait la
          première fois. Le lien « Gérer mes cookies » est présent en bas de chaque page, et rouvre
          le bandeau.
        </p>
        <p className="print:hidden">
          <span className="inline-flex rounded-full border border-hairline-strong px-4 py-2 text-sm font-semibold text-ink">
            <ManageCookiesButton />
          </span>
        </p>
        <p>
          Vous pouvez aussi supprimer les cookies déjà déposés depuis les réglages de votre
          navigateur. Cela vous déconnectera de votre compte et videra votre panier.
        </p>
      </LegalSection>

      <LegalSection title="Vos droits">
        <p>
          Conformément au RGPD et à la loi Informatique et Libertés, vous disposez d’un droit
          d’accès, de rectification et de suppression des données vous concernant, exerçable à tout
          moment auprès de{' '}
          <a href={`mailto:${COMPANY.email}`} className="text-verdigris-deep underline underline-offset-2 hover:text-ink">
            {COMPANY.email}
          </a>
          . Vous pouvez également introduire une réclamation auprès de la CNIL,{' '}
          <a
            href="https://www.cnil.fr"
            target="_blank"
            rel="noreferrer"
            className="text-verdigris-deep underline underline-offset-2 hover:text-ink"
          >
            www.cnil.fr
          </a>
          .
        </p>
      </LegalSection>
    </LegalPage>
  )
}
