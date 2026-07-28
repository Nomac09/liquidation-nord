import type { Metadata } from 'next'
import { BRAND_NAME } from '@/lib/brand'

export const metadata: Metadata = {
  title: 'Conditions générales de vente',
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

export default function CGVPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-12">
      <p className="tag-label">Conditions générales de vente</p>
      <h1 className="mt-2 font-display text-3xl tracking-tight text-ink">
        Conditions générales de vente
      </h1>
      <p className="mt-3 text-sm text-dust">
        En vigueur au {new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}.
      </p>

      <div className="mt-8 rounded-lg border border-hairline bg-alert-pale px-5 py-4 text-sm text-alert">
        Brouillon de travail — à faire relire par un professionnel du droit
        avant publication définitive. La dénomination sociale ci-dessous est
        reprise du nom d’entreprise communiqué pour le compte Stripe
        (« AutoWeb Commerce ») — à confirmer que c’est bien l’entité qui
        exploite ce site avant publication.
      </div>

      <Section title="1. Objet">
        <p>
          Les présentes conditions générales de vente (CGV) régissent les
          ventes réalisées sur le site {BRAND_NAME.toLowerCase()}, exploité
          par AutoWeb Commerce, dont le siège social est situé au 2 Allée de
          la Mannée, Apt 21, 59910 Bondues, immatriculée sous le numéro SIRET
          10014846900016 (nº de TVA intracommunautaire FR44100148469). Toute
          commande passée sur le site implique l’acceptation sans réserve
          des présentes CGV.
        </p>
      </Section>

      <Section title="2. Produits proposés">
        <p>
          Les produits proposés à la vente sont des articles de déstockage
          (surstock, invendus, retours de type « open-box »), vendus à
          l’unité et en stock limité — chaque référence n’existe qu’en un
          seul exemplaire tant qu’elle reste en ligne.
        </p>
        <p>
          Chaque article est contrôlé et filtré avant sa mise en ligne, et
          proposé dans un état comme neuf. La fiche produit précise, le cas
          échéant, toute particularité propre à l’exemplaire mis en vente
          (accessoire manquant, léger défaut esthétique, etc.). Les photos
          présentées sont contractuelles ; en cas de doute sur l’état d’un
          article, l’acheteur est invité à contacter le vendeur avant de
          commander.
        </p>
      </Section>

      <Section title="3. Prix">
        <p>
          Les prix sont indiqués en euros, toutes taxes comprises. La TVA
          n’est pas applicable, conformément à l’article 293 B du Code
          général des impôts. Les frais de livraison sont indiqués avant la
          validation de la commande et s’ajoutent au prix des produits.
        </p>
      </Section>

      <Section title="4. Commande et paiement">
        <p>
          Les commandes sont passées directement sur le site. Le paiement
          s’effectue en ligne, par carte bancaire, via la solution
          sécurisée Stripe. La commande est considérée comme définitive
          après confirmation du paiement.
        </p>
      </Section>

      <Section title="5. Livraison">
        <p>
          Trois modes de récupération sont proposés au choix : retrait
          gratuit à l’entrepôt de Bondues (59910) sur rendez-vous, livraison
          en point relais (Mondial Relay), ou livraison à domicile
          (Cocolis). Le mode choisi et son coût sont indiqués avant le
          paiement.
        </p>
      </Section>

      <Section title="6. Droit de rétractation">
        <p>
          Conformément aux articles L221-18 et suivants du Code de la
          consommation, l’acheteur dispose d’un délai de 14 jours à compter
          de la réception du produit pour exercer son droit de
          rétractation, sans avoir à justifier de motif ni à payer de
          pénalité. Les frais de retour sont à la charge de l’acheteur, sauf
          disposition contraire précisée au moment de la commande.
        </p>
        <p>
          Pour exercer ce droit, l’acheteur notifie sa décision par écrit
          (email) à l’adresse contact@souqify.fr. Le remboursement intervient
          dans un délai de 14 jours à compter de la réception du produit
          retourné, ou de la preuve de son expédition.
        </p>
      </Section>

      <Section title="7. Garanties légales">
        <p>
          Tous les produits vendus bénéficient, indépendamment de leur état
          annoncé, des garanties légales prévues par le Code civil et le
          Code de la consommation : garantie légale de conformité (articles
          L217-3 et suivants du Code de la consommation) et garantie contre
          les vices cachés (articles 1641 et suivants du Code civil). Ces
          garanties s’appliquent de plein droit et ne peuvent être écartées
          par les présentes CGV.
        </p>
        <p>
          En cas de non-conformité ou de défaut non signalé sur la fiche
          produit, l’acheteur peut contacter le vendeur pour obtenir une
          réparation, un remplacement, ou un remboursement, selon les
          modalités prévues par la loi.
        </p>
      </Section>

      <Section title="8. Responsabilité">
        <p>
          Le vendeur ne saurait être tenu responsable des dommages résultant
          d’une mauvaise utilisation du produit acheté, ou d’un usage non
          conforme à sa destination.
        </p>
      </Section>

      <Section title="9. Données personnelles">
        <p>
          Les informations collectées lors de la commande sont nécessaires
          au traitement de celle-ci et sont destinées au vendeur. Elles ne
          sont pas transmises à des tiers en dehors des prestataires
          nécessaires à l’exécution de la commande (paiement, livraison).
          Conformément à la réglementation applicable, l’acheteur dispose
          d’un droit d’accès, de rectification et de suppression de ses
          données, exerçable auprès de contact@souqify.fr, ou par courrier au
          2 Allée de la Mannée, Apt 21, 59910 Bondues.
        </p>
      </Section>

      <Section title="10. Droit applicable et litiges">
        <p>
          Les présentes CGV sont soumises au droit français. En cas de
          litige, l’acheteur peut recourir à une médiation de la
          consommation ou saisir la juridiction compétente.
        </p>
      </Section>

      <Section title="11. Contact">
        <p>
          Pour toute question relative à une commande ou aux présentes CGV,
          l’acheteur peut contacter le vendeur à l’adresse contact@souqify.fr,
          ou par courrier au 2 Allée de la Mannée, Apt 21, 59910 Bondues.
        </p>
      </Section>
    </div>
  )
}
