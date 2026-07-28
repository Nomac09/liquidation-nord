import type { Metadata } from 'next'
import { BRAND_NAME } from '@/lib/brand'

export const metadata: Metadata = {
  title: 'Politique de cookies',
  description: 'Quels cookies et traceurs souqify.fr utilise, et pourquoi.',
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="border-t border-hairline py-8 first:border-t-0 first:pt-0">
      <h2 className="font-display text-xl text-ink">{title}</h2>
      <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-ink/85">
        {children}
      </div>
    </section>
  )
}

function Table({ rows }: { rows: { name: string; purpose: string; duration: string }[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-hairline">
      <table className="w-full text-sm">
        <thead className="bg-paper text-left">
          <tr>
            <th className="px-4 py-2.5 font-semibold text-ink">Nom</th>
            <th className="px-4 py-2.5 font-semibold text-ink">Finalité</th>
            <th className="px-4 py-2.5 font-semibold text-ink">Durée</th>
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
    <div className="container mx-auto max-w-3xl px-4 py-12">
      <p className="tag-label">Politique de cookies</p>
      <h1 className="mt-2 font-display text-3xl tracking-tight text-ink">
        Politique de cookies
      </h1>
      <p className="mt-3 text-sm text-dust">
        En vigueur au {new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}.
      </p>

      <Section title="Ce que nous n’utilisons pas">
        <p>
          {BRAND_NAME} n’utilise aucun cookie publicitaire, aucun cookie de traçage entre sites, et aucun
          outil comme Google Analytics, Meta Pixel ou équivalent. Il n’y a rien à accepter ou refuser : tout ce que
          ce site dépose sur votre appareil est strictement nécessaire à son fonctionnement, et la seule mesure
          d’audience utilisée ne dépose ni cookie ni identifiant.
        </p>
      </Section>

      <Section title="Cookies strictement nécessaires">
        <p>
          Ces cookies sont indispensables au fonctionnement du site — connexion à votre compte, panier, paiement.
          Conformément à l’article 82 de la loi Informatique et Libertés, ils sont dispensés de consentement.
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
          Si vous choisissez de vous connecter avec Google, Google dépose ses propres cookies le temps de cette
          connexion — nous ne les contrôlons pas ; leur politique est disponible sur{' '}
          <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer" className="text-verdigris-deep hover:underline">
            policies.google.com
          </a>.
        </p>
      </Section>

      <Section title="Stockage local (pas des cookies)">
        <p>
          Certaines informations sont conservées dans votre navigateur (localStorage/sessionStorage), jamais
          transmises à un serveur tiers : le contenu de votre panier, votre mode d’affichage préféré (Galerie ou
          Liste), votre position de défilement dans la liste des pièces, et — le temps du paiement — la session
          Stripe en cours. Rien de tout cela ne sert à vous suivre d’un site à l’autre.
        </p>
      </Section>

      <Section title="Mesure d’audience — sans cookie">
        <p>
          Nous utilisons Vercel Web Analytics pour savoir quelles pages sont consultées et estimer la
          fréquentation du site. Cet outil ne dépose ni cookie ni identifiant persistant sur votre appareil, ne vous
          reconnaît pas d’une visite à l’autre, et ne permet pas de vous identifier personnellement. Les données
          agrégées (pages vues, provenance, pays) sont traitées par Vercel Inc., notre hébergeur.
        </p>
      </Section>

      <Section title="Vos droits">
        <p>
          Conformément au RGPD et à la loi Informatique et Libertés, vous disposez d’un droit d’accès, de
          rectification et de suppression des données vous concernant, exerçable à tout moment auprès de{' '}
          <a href="mailto:contact@souqify.fr" className="text-verdigris-deep hover:underline">contact@souqify.fr</a>.
          Vous pouvez aussi supprimer les cookies déjà déposés à tout moment depuis les réglages de votre
          navigateur — cela vous déconnectera de votre compte et videra votre panier.
        </p>
      </Section>
    </div>
  )
}
