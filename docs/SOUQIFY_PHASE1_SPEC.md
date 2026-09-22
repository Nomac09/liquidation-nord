# SOUQIFY PHASE 1 SPEC: legal identity, TVA, CGV, affiliate content section

Project: /Users/nasim/liquidation-nord (Next.js, MongoDB, Stripe, Resend, Vercel)
Live site: https://www.souqify.fr

## 0. Ground rules for this job

- Work on a new branch `phase1-legal-affiliate`. Do not deploy. Do not push to main.
- One commit per task below, so each can be reverted on its own.
- The existing store (catalogue, cart, checkout, Stripe, order emails) must keep working. Do not refactor anything not listed here.
- Before changing anything, inspect the repo and write `docs/PHASE1_AUDIT.md` answering the "Check first" questions in each section. If the codebase contradicts this spec, stop and report instead of guessing.
- Never use em dashes in any user-facing copy. Use hyphens, commas or colons.
- All user-facing copy is French.
- Any value marked `[À COMPLÉTER]` must live ONLY in `lib/company.ts`. Add a check (script `npm run check:legal`, also run in CI/build) that fails if any `[À COMPLÉTER]` string would render on a public page.

---

## TASK 1. Single source of truth for company identity

Create `lib/company.ts`:

```ts
export const COMPANY = {
  tradeName: "Souqify",
  legalName: "AUTOWEB COMMERCE SAS",
  legalForm: "Société par actions simplifiée (SAS)",
  shareCapital: "[À COMPLÉTER] €",
  siren: "100 148 469",
  siret: "100 148 469 00016",
  rcs: "RCS Lille Métropole 100 148 469", // to confirm against the Kbis
  vatNumber: "FR44100148469",
  headOffice: {
    line1: "2 Allée de la Mannée, Apt 21",
    postalCode: "59910",
    city: "Bondues",
    country: "France",
  },
  pickup: {
    label: "Entrepôt Bondues (59910), Nord",
    hours: "Lun-Sam, 9h-18h, sur rendez-vous",
  },
  email: "contact@souqify.fr",
  phone: "[À COMPLÉTER]",
  publicationDirector: "Nasim Alsawalma, Président",
  host: {
    name: "Vercel Inc.",
    address: "440 N Barranca Ave #4133, Covina, CA 91723, États-Unis", // verify on vercel.com/legal
    website: "https://vercel.com",
  },
  mediator: {
    name: "[À COMPLÉTER]",
    website: "[À COMPLÉTER]",
    address: "[À COMPLÉTER]",
  },
  vat: { applicable: true, standardRate: 0.2 },
  deliveryDelays: {
    pickup: "[À COMPLÉTER]",
    mondialRelay: "[À COMPLÉTER]",
    cocolis: "[À COMPLÉTER]",
  },
  cgvVersionDate: "[À COMPLÉTER: date de mise en ligne]",
} as const;
```

Every page, component and email that shows company identity must read from this file. Grep the repo for `AutoWeb Commerce`, `293 B`, `TVA non applicable`, `10014846900016`, `Allée de la Mannée`, `contact@souqify.fr` and replace hardcoded values with `COMPANY.*`.

## TASK 2. TVA switch (company is now VAT-registered)

The company is no longer under franchise en base. Remove every mention of "TVA non applicable, art. 293 B du CGI" (footer, CGV art. 3, emails, invoices, Stripe receipt text, anywhere else).

Check first (report in PHASE1_AUDIT.md, do NOT change pricing logic without confirmation):
1. Are displayed product prices stored as TTC? (Assume yes: prices stay as displayed, they are now TTC incl. 20 % TVA.)
2. Does the app generate invoices or order-confirmation emails? What do they currently show?
3. Is Stripe Tax enabled, or any tax setting on Stripe products/checkout?

Then:
- Footer text becomes: `Prix TTC, TVA 20 % incluse · Paiement sécurisé Stripe`.
- Order confirmation email and any invoice: show total HT, TVA 20 %, total TTC (per line and total), plus legal name, SIREN, VAT number, head office address, invoice number (sequential, no gaps), date, customer name/address. Compute HT = TTC / 1.2, round per line to 2 decimals, and make the TVA line = TTC total minus HT total so totals always reconcile.
- If no invoice generation exists, do NOT build one in this job. Just list it as a gap in the audit.

## TASK 3. Footer legal block

Replace the current footer bottom row with:

```
© 2026 Souqify, marque exploitée par AUTOWEB COMMERCE SAS
SIREN 100 148 469 · TVA FR44100148469 · Siège : 2 Allée de la Mannée, Apt 21, 59910 Bondues
Mentions légales · CGV · Confidentialité · Cookies · Transparence & affiliation · Rétractation
Prix TTC, TVA 20 % incluse · Paiement sécurisé Stripe
Souqify n'est pas affilié à vidaXL. Les marques citées appartiennent à leurs propriétaires.
```

All from `COMPANY`. Add a "Gérer mes cookies" link that reopens the consent banner (if a consent tool exists; check first).

## TASK 4. Pages to create or replace

| Route | Status | Content |
|---|---|---|
| `/mentions-legales` | NEW | Section A below |
| `/cgv` | REPLACE | Section B below. Remove the "Brouillon de travail" banner entirely |
| `/retractation` | NEW | Intro + formulaire de rétractation (Section B, annexe) + mailto link prefilled |
| `/transparence-affiliation` | NEW | Section C below |
| `/politique-confidentialite` | CHECK | Check first whether `/politique-cookies` already covers privacy (data controller, purposes, legal bases, retention, recipients incl. Stripe/Resend/Mondial Relay/Cocolis/Vercel/MongoDB, transfers outside EU, rights, CNIL complaint). Report gaps; do not write legal text beyond what is listed |

All legal pages: `robots: index, follow`, own meta title/description (not the homepage description, which is currently duplicated on /cgv), `lastUpdated` date shown at top, printable layout.

### Section A. Mentions légales (text)

```
Mentions légales

Éditeur du site
Le site souqify.fr est édité par AUTOWEB COMMERCE SAS, société par actions simplifiée au capital de {shareCapital}, immatriculée au {rcs}, SIRET {siret}.
Siège social : {headOffice}.
Numéro de TVA intracommunautaire : {vatNumber}.
Email : {email} · Téléphone : {phone}.
Souqify est une marque commerciale exploitée par AUTOWEB COMMERCE SAS.

Directeur de la publication
{publicationDirector}.

Hébergement
{host.name}, {host.address}, {host.website}.

Propriété intellectuelle
Les textes, guides, photographies réalisées par Souqify et la mise en page du site sont la propriété d'AUTOWEB COMMERCE SAS. Toute reproduction sans autorisation est interdite. Les marques et noms de produits de tiers cités sur le site (dont vidaXL et Amazon) appartiennent à leurs propriétaires respectifs ; leur mention sert uniquement à identifier les produits. Souqify n'est ni affilié à vidaXL, ni partenaire officiel de cette marque.

Liens partenaires
Certains contenus du site contiennent des liens partenaires. Voir la page Transparence & affiliation.

Données personnelles
Voir la Politique de confidentialité et la Politique cookies.

Médiation de la consommation
{mediator.name}, {mediator.address}, {mediator.website}.
```

### Section B. Conditions générales de vente (text)

```
Conditions générales de vente
En vigueur au {cgvVersionDate}

Article 1. Identification du vendeur
Le site souqify.fr (ci-après « le Site ») est exploité sous la marque Souqify par AUTOWEB COMMERCE SAS, société par actions simplifiée au capital de {shareCapital}, immatriculée au {rcs}, SIRET {siret}, dont le siège social est situé {headOffice}, numéro de TVA intracommunautaire {vatNumber} (ci-après « le Vendeur »).
Contact : {email} · {phone} · courrier au siège social.

Article 2. Champ d'application
Les présentes conditions générales de vente (CGV) s'appliquent à toute vente conclue sur le Site entre le Vendeur et un acheteur agissant en qualité de consommateur (ci-après « l'Acheteur »), pour une livraison ou un retrait en France métropolitaine. L'Acheteur déclare avoir pris connaissance des CGV et les accepter avant de passer commande, par une case à cocher lors de la validation de la commande. Les CGV applicables sont celles en vigueur à la date de la commande.

Article 3. Produits
Les produits proposés sont des articles de déstockage : surstocks, fins de série, invendus et retours de type « open-box ». Sauf mention contraire, chaque article est vendu à l'unité et n'existe qu'en un seul exemplaire.
Chaque article est contrôlé avant sa mise en ligne. La fiche produit décrit ses caractéristiques essentielles et précise, le cas échéant, les particularités propres à l'exemplaire vendu (emballage ouvert ou abîmé, accessoire manquant, défaut esthétique, etc.). Les photographies illustrent l'article ; lorsqu'une particularité de l'exemplaire est signalée, une photo de cette particularité est jointe dans la mesure du possible. En cas de doute sur l'état d'un article, l'Acheteur peut contacter le Vendeur avant de commander.
Les offres sont valables dans la limite des stocks disponibles. Si un article devient indisponible après la commande (vente simultanée d'un exemplaire unique), le Vendeur en informe l'Acheteur sans délai et le rembourse intégralement dans un délai de 14 jours au plus tard.

Article 4. Prix
Les prix sont indiqués en euros, toutes taxes comprises (TTC), TVA française au taux applicable incluse. Les frais de livraison sont indiqués avant la validation de la commande et s'ajoutent au prix des produits.
Lorsqu'un prix de comparaison est affiché, sa nature est précisée sur la fiche produit (par exemple le prix de vente pratiqué par un autre distributeur à la date indiquée). Il ne constitue pas une réduction de prix pratiquée par le Vendeur, sauf mention expresse.
Le Vendeur peut modifier ses prix à tout moment ; le prix facturé est celui affiché lors de la validation de la commande.

Article 5. Commande
L'Acheteur sélectionne les articles, choisit le mode de livraison ou de retrait, vérifie le récapitulatif de sa commande et son prix total, puis accepte les CGV et valide la commande par le bouton « Commander avec obligation de paiement » (ou formulation équivalente). La vente est conclue à la confirmation du paiement. Un email de confirmation récapitulant la commande et reprenant les présentes CGV (ou un lien durable vers celles-ci) est envoyé à l'Acheteur.
Le Vendeur peut refuser une commande en cas de litige existant avec l'Acheteur ou de suspicion de fraude.

Article 6. Paiement
Le paiement s'effectue en ligne par carte bancaire via la solution sécurisée Stripe. Le montant est débité lors de la validation de la commande. Le Vendeur n'a pas accès aux données bancaires de l'Acheteur.

Article 7. Livraison et retrait
Trois modes sont proposés :
- retrait gratuit à l'entrepôt de Bondues (59910), sur rendez-vous, {pickup.hours}. Délai : {deliveryDelays.pickup} ;
- livraison en point relais Mondial Relay. Délai indicatif : {deliveryDelays.mondialRelay} ;
- livraison à domicile par Cocolis. Délai indicatif : {deliveryDelays.cocolis}.
Le mode choisi, son coût et la date ou le délai de livraison sont indiqués avant la validation de la commande. À défaut d'indication, la livraison intervient au plus tard 30 jours après la conclusion du contrat.
En cas de retard, l'Acheteur peut, après avoir enjoint le Vendeur par écrit de livrer dans un délai supplémentaire raisonnable, résoudre le contrat si la livraison n'intervient pas dans ce délai, conformément aux articles L216-2 et suivants du Code de la consommation. Il est alors remboursé de la totalité des sommes versées au plus tard dans les 14 jours.
Le risque de perte ou d'endommagement des produits est transféré à l'Acheteur au moment où il prend physiquement possession des produits, ou un tiers désigné par lui.
Il est recommandé à l'Acheteur de vérifier l'état du colis à la réception et de signaler toute anomalie au transporteur et au Vendeur. Cette vérification ne prive pas l'Acheteur de ses droits légaux.
En cas de retrait, l'Acheteur dispose de [À COMPLÉTER, par exemple 15] jours après la confirmation de commande pour fixer un rendez-vous ; passé ce délai et après relance restée sans réponse, le Vendeur peut annuler la commande et rembourser l'Acheteur.

Article 8. Droit de rétractation
8.1 Délai. L'Acheteur dispose d'un délai de 14 jours pour se rétracter, sans motif ni pénalité. Ce délai court à compter de la prise de possession physique du bien par l'Acheteur (y compris lors d'un retrait à l'entrepôt). Pour une commande de plusieurs biens livrés séparément, il court à compter de la réception du dernier bien.
8.2 Exercice. L'Acheteur notifie sa décision avant l'expiration du délai, au moyen du formulaire de rétractation figurant en annexe (également disponible sur la page /retractation) ou de toute autre déclaration dénuée d'ambiguïté, par email à {email} ou par courrier au siège social.
8.3 Retour du bien. L'Acheteur renvoie ou rapporte le bien au Vendeur au plus tard 14 jours après avoir communiqué sa décision. Il peut également le rapporter à l'entrepôt de Bondues sur rendez-vous. Les frais directs de renvoi sont à la charge de l'Acheteur. Pour les biens qui, en raison de leur taille ou de leur poids, ne peuvent normalement être renvoyés par la poste, le coût estimé du renvoi est de [À COMPLÉTER] € ; ce coût est indiqué sur la fiche produit concernée.
8.4 Remboursement. Le Vendeur rembourse la totalité des sommes versées, frais de livraison initiaux inclus (dans la limite du mode de livraison standard le moins coûteux proposé), au plus tard 14 jours après avoir été informé de la décision de rétractation. Le Vendeur peut différer le remboursement jusqu'à la récupération du bien ou jusqu'à ce que l'Acheteur ait fourni une preuve de l'expédition du bien, la date retenue étant celle du premier de ces faits. Le remboursement est effectué par le même moyen de paiement que celui utilisé pour la commande.
8.5 Dépréciation. La responsabilité de l'Acheteur peut être engagée en cas de dépréciation du bien résultant de manipulations autres que celles nécessaires pour établir la nature, les caractéristiques et le bon fonctionnement du bien. L'état initial de l'exemplaire décrit sur la fiche produit sert de référence.

Article 9. Garanties légales
Tous les produits, y compris les articles de déstockage et open-box, bénéficient de plein droit de la garantie légale de conformité (articles L217-1 et suivants du Code de la consommation) et de la garantie légale des vices cachés (articles 1641 à 1649 du Code civil). Les particularités de l'exemplaire expressément signalées sur la fiche produit avant l'achat ne constituent pas un défaut de conformité.
[ENCADRÉ OBLIGATOIRE : reproduire ici mot pour mot le texte de l'encadré relatif à la garantie légale de conformité et à la garantie des vices cachés figurant en annexe du décret n° 2022-424 du 25 mars 2022. Claude Code : insérer un composant <LegalGuaranteeBox /> avec un TODO clair ; le texte officiel doit être copié depuis Légifrance, pas réécrit.]
Pour mettre en œuvre une garantie, l'Acheteur contacte le Vendeur à {email} en décrivant le défaut, si possible avec photos.

Article 10. Responsabilité
Le Vendeur n'est pas responsable des dommages résultant d'une utilisation du produit non conforme à sa destination ou aux instructions du fabricant, ni de l'inexécution due à un cas de force majeure. Cette clause ne limite en rien les garanties légales ni la responsabilité du Vendeur envers un consommateur telle que prévue par la loi.

Article 11. Données personnelles
Les données collectées lors de la commande sont traitées par AUTOWEB COMMERCE SAS pour l'exécution de la commande et le respect des obligations légales. Leur traitement est décrit dans la Politique de confidentialité, accessible depuis chaque page du Site. L'Acheteur peut exercer ses droits à {email}.

Article 12. Réclamations et médiation
Toute réclamation est adressée au service client à {email}. En cas d'échec de la réclamation écrite, l'Acheteur peut recourir gratuitement au médiateur de la consommation dont relève le Vendeur : {mediator.name}, {mediator.address}, {mediator.website}.

Article 13. Droit applicable
Les présentes CGV sont soumises au droit français. À défaut de résolution amiable, le litige est porté devant la juridiction compétente selon les règles de droit commun ; le consommateur peut notamment saisir la juridiction du lieu où il demeurait au moment de la conclusion du contrat ou de la survenance du fait dommageable.

ANNEXE. Formulaire de rétractation
(Veuillez compléter et renvoyer le présent formulaire uniquement si vous souhaitez vous rétracter du contrat.)
À l'attention de AUTOWEB COMMERCE SAS (Souqify), {headOffice}, {email} :
Je/nous (*) vous notifie/notifions (*) par la présente ma/notre (*) rétractation du contrat portant sur la vente du bien (*) ci-dessous :
Commandé le (*) / reçu le (*) :
Numéro de commande :
Nom du (des) consommateur(s) :
Adresse du (des) consommateur(s) :
Signature du (des) consommateur(s) (uniquement en cas de notification du présent formulaire sur papier) :
Date :
(*) Rayez la mention inutile.
```

Checkout checks tied to the CGV (check first, report, then implement only if missing):
- Mandatory unchecked checkbox "J'ai lu et j'accepte les CGV" linking to /cgv before payment.
- Final button wording makes the payment obligation explicit ("Commander avec obligation de paiement" or "Payer {total}").
- Order confirmation email includes a link to the CGV version in force (store `cgvVersionDate` on the order document).

### Section C. Transparence & affiliation (text)

```
Transparence & affiliation

Souqify vend ses propres articles de déstockage, expédiés depuis Bondues. Dans nos guides, nous recommandons aussi parfois des produits que nous ne vendons pas, lorsqu'ils répondent mieux à un besoin (taille, usage, budget) que ce que nous avons en stock.

Ces recommandations sont signalées par le badge « Lien partenaire ». Si vous achetez via ces liens, nous pouvons percevoir une commission, sans surcoût pour vous. L'achat est alors conclu avec le marchand concerné (par exemple Amazon), selon ses propres conditions de vente, de livraison et de retour. Souqify n'est pas le vendeur de ces produits.

En tant que Partenaire Amazon, je réalise un bénéfice sur les achats remplissant les conditions requises.

Les commissions n'influencent pas le choix des produits : un produit Souqify et un produit partenaire sont présentés selon les mêmes critères, avec leurs avantages et leurs limites.
```

---

## TASK 5. Content section `/guides`

Build with MDX files in the repo (`content/guides/*.mdx`) with typed frontmatter. No database, no admin UI in this phase. This keeps content versioned and reversible.

Routes:
- `/guides` : hub listing all guides, grouped by category (Jardin & Extérieur, Piscine, Mobilier, Déco & Linge de maison, Vélo & mobilité).
- `/guides/[slug]` : article page.

Frontmatter schema (validate with zod at build time; build fails on invalid frontmatter):

```ts
{
  title: string;            // H1
  slug: string;
  metaTitle: string;        // <= 60 chars
  metaDescription: string;  // <= 155 chars
  category: string;
  author: string;           // "Nasim, Souqify"
  publishedAt: string;      // ISO
  updatedAt: string;        // ISO
  hasAffiliateLinks: boolean;
  faq?: { q: string; a: string }[];
  heroImage?: { src: string; alt: string };  // own photos only
}
```

Article page layout:
1. Breadcrumb (Accueil > Guides > {category} > {title}) + BreadcrumbList JSON-LD.
2. H1, author, "Mis à jour le {updatedAt}".
3. If `hasAffiliateLinks`: `<AffiliateDisclosure variant="banner" />` directly under the H1, above any link.
4. MDX body.
5. FAQ block (if faq) + FAQPage JSON-LD only when the FAQ is visible on the page.
6. "Nos articles en stock" strip: up to 4 own products from the same category (reuse existing product card, in-stock only).
7. Article JSON-LD (headline, author, datePublished, dateModified, publisher = AUTOWEB COMMERCE SAS / Souqify).

Add `/guides` and every guide to the sitemap and to header navigation ("Guides") and footer.

## TASK 6. Product components usable inside MDX

### `<OwnProduct id="..." />`
Pulls the live product from MongoDB at build/request time (ISR ok). Shows image, name, price TTC, condition notes, "Vendu et expédié par Souqify" label, button "Voir l'article" to /product/[slug]. If sold out: render "Vendu, voir des articles similaires" linking to the category, never a dead card.

### `<AffiliateProduct />`
Props:
```ts
{
  id: string;               // internal id, e.g. "amz-toile-auvent-3x4"
  merchant: "amazon" | "awin" | "affilae";
  merchantName: string;     // "Amazon"
  name: string;
  url: string;              // full tagged URL
  reason: string;           // "Pourquoi on le recommande"
  pros: string[];
  cons: string[];
  image?: { src: string; alt: string }; // see rule below
  category: string;
}
```
Rendering rules:
- Top-left badge: "Lien partenaire". Merchant line: "Vendu par {merchantName}, pas par Souqify".
- CTA text: "Voir sur {merchantName}". Never "Ajouter au panier", never a cart icon, never the Souqify price styling (no strikethrough, no −50 % badge).
- Visually distinct from own-product cards (different background/border token), consistent everywhere.
- NO price displayed for Amazon products. Amazon only allows prices obtained through its API and kept fresh; we don't have API access yet. Show "Voir le prix actuel sur Amazon" instead.
- NO Amazon product images copied or hotlinked. Either no image, our own photo, or (later) images from the official API. If `image` is absent, render a clean text card.
- Link: `<a href={url} target="_blank" rel="sponsored nofollow noopener">`. Link directly to amazon.fr with the tag. Do not build a redirect/cloaking route for Amazon links.
- Small inline line under the CTA: "Lien partenaire, voir Transparence & affiliation" linking to the page.

### `<AffiliateDisclosure variant="banner" | "inline" />`
Banner text: "Cet article contient des liens partenaires signalés par le badge « Lien partenaire ». En tant que Partenaire Amazon, je réalise un bénéfice sur les achats remplissant les conditions requises. Souqify n'est pas le vendeur de ces produits." Link to /transparence-affiliation.

### `<ComparisonTable />`
Columns: product, vendu par, points forts, limites, lien. Own and affiliate rows can coexist; affiliate rows carry the badge and no Amazon price.

## TASK 7. Analytics (consent-gated)

Check first: which analytics and consent tool exist today? Report.

If GA4 is absent: add GA4 via `@next/third-parties` or gtag with Google Consent Mode v2, default denied, updated from the consent banner. No analytics cookie before consent.

Events (fire with `navigator.sendBeacon`/gtag `transport_type: 'beacon'` so outbound clicks aren't lost):

| Event | When | Params |
|---|---|---|
| `affiliate_click` | click on AffiliateProduct CTA | `affiliate_id, merchant, product_name, category, page_slug, position` |
| `own_product_click` | click on OwnProduct from a guide | `product_id, category, page_slug, position, price` |
| `guide_view` | guide page view | `page_slug, category, has_affiliate_links` |
| existing ecommerce | keep or add `view_item, add_to_cart, begin_checkout, purchase` | standard GA4 ecommerce params, `value` in TTC |

Also store affiliate clicks server-side (no personal data): POST `/api/track/affiliate-click` writing `{affiliateId, merchant, pageSlug, position, ts}` to a Mongo collection `affiliate_clicks`. This works even when analytics consent is refused, because it stores no identifier. Rate-limit the endpoint.

## TASK 8. Quick SEO fixes (low risk only)

- Each page gets its own meta description (legal pages currently reuse the homepage one).
- Homepage title: keep "vidaXL" as a product descriptor but do not present Souqify as a vidaXL store. Proposed: `Souqify : déstockage jardin, mobilier et déco à Bondues (59)`.
- Twitter card `summary_large_image` with an OG image for home and guides.
- Canonicals on guides and legal pages.
- Do NOT change category URLs (`/?category=...`) in this phase. Just report in the audit how they are indexed today.

## TASK 9. Tests

- Playwright: /mentions-legales, /cgv, /retractation, /transparence-affiliation, /guides and one sample guide render with status 200 and contain no `[À COMPLÉTER]`, no `293 B`, no "Brouillon".
- Playwright: AffiliateProduct link has `rel` containing `sponsored` and `nofollow`, opens new tab, has the badge, has no price, and the disclosure banner appears above the first affiliate link.
- Playwright: full checkout on Stripe test mode still works end to end, CGV checkbox is required.
- Unit: HT/TVA/TTC calculation reconciles on sample carts.
- Lighthouse on a guide page: accessibility >= 95, no CLS from product cards.
- Accessibility: badges readable by screen readers ("Lien partenaire, s'ouvre dans un nouvel onglet"), color contrast AA.

## TASK 10. Sample guide

Create ONE placeholder guide `content/guides/exemple.mdx` with `draft: true` (excluded from sitemap and hub, noindex) that uses every component, so Nasim can preview the layout. Real articles are written separately.

## Deliverables at the end

1. `docs/PHASE1_AUDIT.md` with every "Check first" answer and any gap found.
2. List of every file changed.
3. The exact list of `[À COMPLÉTER]` values still needed.
4. Do not deploy.
