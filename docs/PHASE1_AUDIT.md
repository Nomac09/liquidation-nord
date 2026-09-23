# PHASE 1 AUDIT

Repo: `/Users/nasim/liquidation-nord` · Branch: `phase1-legal-affiliate` · Date: 2026-09-22
Audited commit: `fb2c42d` (main)

This document answers every "Check first" question in `docs/SOUQIFY_PHASE1_SPEC.md`, lists the
gaps found, and flags the places where the codebase contradicts the spec. Nothing outside this
file was changed before it was written.

---

## 0. Summary of what matters most

| # | Finding | Severity |
|---|---|---|
| 1 | No order-confirmation email exists anywhere in the app, but `/success` tells the customer "La confirmation part à {email}" | High: a promise the site does not keep |
| 2 | No invoice generation of any kind. No invoice number sequence, no HT/TVA/TTC breakdown anywhere | High for a VAT-registered company |
| 3 | `TVA non applicable, art. 293 B du CGI` renders on 4 public surfaces (footer, cart, checkout, CGV art. 3) and is now false | High: incorrect tax statement |
| 4 | Stripe Tax is provisioned and `active` on the account, but no checkout session ever enables it and there is no FR tax registration | Medium: see §2.3, decision needed |
| 5 | No CGV acceptance checkbox at checkout; nothing links the order to a CGV version | Medium: L221-14 / proof-of-acceptance gap |
| 6 | `/mentions-legales` does not exist at all | High: mandatory under LCEN art. 6 |
| 7 | No privacy policy: `/politique-cookies` covers cookies only, ~8 mandatory RGPD items missing | High |
| 8 | No consent tool. `CookieNotice` is a dismissible disclosure banner with no accept/refuse state | Blocks Task 7 as written |
| 9 | No test infrastructure at all (no Playwright, no unit runner, no CI) | Task 9 is a from-scratch build |
| 10 | Spec's guide categories do not match the site's real category taxonomy | Contradiction, see §9.1 |

---

## 1. TASK 1 — hardcoded company identity

No `lib/company.ts` exists. Identity strings are inlined in 8 files. Full grep results:

### `AutoWeb Commerce` / legal name
| File:line | Current text |
|---|---|
| `app/cgv/page.tsx:40` | `(« AutoWeb Commerce ») — à confirmer que c'est bien l'entité…` (inside the draft banner) |
| `app/cgv/page.tsx:48` | `exploité par AutoWeb Commerce, dont le siège social est situé au…` |

Note the casing: the site writes `AutoWeb Commerce`, the spec writes `AUTOWEB COMMERCE SAS`. The
legal form (`SAS`) is currently never stated on any public page.

### `SIRET` / `10014846900016` / VAT number
| File:line | Current text |
|---|---|
| `app/cgv/page.tsx:49-50` | `immatriculée sous le numéro SIRET 10014846900016 (nº de TVA intracommunautaire FR44100148469)` |

SIRET is rendered unspaced (`10014846900016`); the spec's `COMPANY.siret` is spaced
(`100 148 469 00016`). SIREN alone is never shown. RCS is never shown. Share capital is never
shown. All three are mandatory on a French commercial site.

### `Allée de la Mannée` (head office)
| File:line | Current text |
|---|---|
| `app/cgv/page.tsx:49` | `2 Allée de la Mannée, Apt 21, 59910 Bondues` |
| `app/cgv/page.tsx:154` | same, in art. 9 (données personnelles) |
| `app/cgv/page.tsx:170` | same, in art. 11 (contact) |

### `contact@souqify.fr`
| File:line | Context |
|---|---|
| `components/Footer.tsx:35-36` | footer contact column |
| `components/ConditionBadge.tsx:29` | "une question sur l'état ?" link |
| `components/EmailVerificationBanner.tsx:37` | error fallback copy |
| `app/cgv/page.tsx:113, 153, 169` | rétractation / RGPD / contact |
| `app/politique-cookies/page.tsx:131` | droits RGPD |
| `app/success/page.tsx:59-60` | order-not-found fallback |
| `app/cart/page.tsx:145` | checkout error fallback |
| `app/account/orders/[orderId]/page.tsx:134` | order detail footer |

### Other identity-ish values not in the spec's grep list but found
| File:line | Value |
|---|---|
| `components/Footer.tsx:24-28` | warehouse block: `Bondues (59910), Nord` / `Retrait gratuit sur rendez-vous` / `Lun–Sam · 9h–18h` — maps to `COMPANY.pickup.label` + `COMPANY.pickup.hours` |
| `components/Footer.tsx:44-46` | hardcoded delivery prices `29,99 €` / `79,99 €` which **contradict `lib/shipping.ts`**: those are only the cheapest weight band. See §9.2 |
| `components/Header.tsx:33` | `Déstockage · Bondues (59)` |
| `lib/shipping.ts:10`, `app/account/orders/[orderId]/page.tsx:13` | `Retrait à Bondues` duplicated in two places |
| `app/robots.ts:3`, `app/sitemap.ts:6`, `lib/email.ts:23`, `app/product/[slug]/page.tsx:79` | `https://www.souqify.fr` hardcoded 4× |

The phone number is **nowhere on the site today**. `COMPANY.phone` is `[À COMPLÉTER]` and is
required by the spec's Section A and CGV art. 1, so it is a blocking value (see §11).

---

## 2. TASK 2 — TVA switch

### 2.1 Are displayed product prices stored as TTC?

**Yes, and they can be treated as TTC with no pricing-logic change.** Evidence:

- `lib/schemas/Product.ts:45` — `salePrice: Number`, a single plain number. There is no `priceHT`,
  no `taxRate`, no `taxBehavior` field. Same for `rrp`.
- `app/api/checkout/create-session/route.ts:137` — the Stripe line item is
  `unit_amount: Math.round(i.price * 100)` with **no `tax_behavior`**, so Stripe charges exactly
  the displayed number.
- `app/cgv/page.tsx:76` currently states `Les prix sont indiqués en euros, toutes taxes comprises`
  — already TTC wording, immediately contradicted by the next sentence claiming 293 B.
- `lib/shipping.ts` prices (29,99 / 34,99 / … / 149,99) are likewise flat displayed amounts.

So the spec's assumption holds: **prices stay as displayed and are now TTC incl. 20 % TVA.** The
only change is what is *said* about them and how they are *broken down* on documents. No `total`,
`subtotal` or `shippingCost` value anywhere in the DB or in Stripe needs to move.

Consequence worth stating plainly: margin drops by 16.67 % of every sale from the moment the
company became VAT-registered, unless prices are raised. That is a business decision, out of scope
here, but it is the real-world effect of "prices stay as displayed".

### 2.2 Does the app generate invoices or order-confirmation emails? What do they show?

**Neither exists.**

`lib/email.ts` exports exactly two senders:

| Function | Trigger | Content |
|---|---|---|
| `sendVerificationEmail` | account registration (`app/api/auth/register/route.ts`) | "Confirmez votre adresse email" + token link. No order data, no company identity, no legal footer. |
| `sendNewArrivalNotifications` | admin action (`app/api/admin/notify-new-arrival/route.ts`) | "Nouveautés chez Souqify" marketing blast + unsubscribe link. |

There is **no third sender**. Critically, `app/api/webhooks/stripe/route.ts` — the only place an
order is marked paid (`markOrderPaid`, line 68) — writes to Mongo and returns. It never imports
`lib/email.ts`.

Yet `app/success/page.tsx:79-81` renders:

> La confirmation part à **{order.customerEmail}**.

and `app/success/page.tsx:56-58` (the order-not-found branch) renders:

> Si vous venez de payer, vous recevrez l'email de confirmation dans quelques minutes.

**The site promises an email it does not send.** The only email a customer can possibly receive
after paying is Stripe's own receipt, which is a Dashboard-level setting
(Settings → Customer emails → "Successful payments") that cannot be read from this repo or from
the API. It must be checked manually in the Stripe Dashboard. Even if it is on, a Stripe receipt
is not a French invoice: it carries no SIREN, no VAT number, no sequential invoice number, and no
HT/TVA breakdown.

Invoices: no PDF generation, no invoice-number counter, no `invoices` collection, no
`stripe.invoices.*` call anywhere. `grep -r "invoice"` over `app/`, `lib/`, `components/` returns
nothing.

**Gap, per the spec's instruction ("If no invoice generation exists, do NOT build one in this
job"):** invoice generation is out of scope for Phase 1 and is recorded here as a gap. I am
treating the order-confirmation email as falling under the same instruction, because an email
carrying the full HT/TVA/TTC breakdown plus a sequential invoice number *is* the invoice for a
B2C sale; building it is a new feature, not a legal-copy change. See §12 for the minimum
honest-copy fix proposed instead.

What the Order document stores today (`lib/schemas/Order.ts`), for whoever builds the invoice
later — everything needed is already there except the tax split and the invoice number:

```
orderId (e.g. "SQ-MF3K2P-9XQ2", non-sequential, has gaps → NOT usable as an invoice number)
items[] { productId, name, price, quantity }   ← price is TTC per unit
subtotal, shippingMethod, shippingCost, total  ← all TTC
shippingDetails { line1, line2, postalCode, city, country }
customerEmail, customerName, customerPhone, userId
paymentStatus, deliveryStatus, trackingNumber, soldConflicts, createdAt
```

Missing for an invoice: sequential `invoiceNumber`, `invoicedAt`, and the `cgvVersionDate` the
spec wants pinned on the order.

### 2.3 Is Stripe Tax enabled, or any tax setting on Stripe products/checkout?

Queried live against the test-mode key in `.env.local` (read-only `GET`s):

```
GET /v1/tax/settings
  status: "active"
  defaults.tax_behavior: "inferred_by_currency"
  defaults.tax_code: "txcd_10000000"   (general - tangible goods)
  head_office.address: 2 Allée de la Mannée, Aprtment 21, 59910 Bondues, FR
  livemode: false

GET /v1/tax/registrations  →  []   (empty)

GET /v1/account
  country: FR, default_currency: eur, business_type: "individual"
  settings.invoices.default_account_tax_ids: null
  dashboard display_name: "Souqify.fr"
```

Reading of that:

1. **Stripe Tax is provisioned (`status: active`) but not in use.** Nothing in the codebase ever
   sets `automatic_tax: { enabled: true }` on a Checkout Session, and no `price_data` carries a
   `tax_behavior`. `app/api/checkout/create-session/route.ts:128-158` is the only session-creation
   call site. Stripe therefore calculates zero tax on every current order.
2. **There is no FR tax registration.** Even if `automatic_tax` were switched on tomorrow, Stripe
   would compute 0 % for France until a registration is added, because registrations are what tell
   Stripe where you are liable.
3. `default_account_tax_ids: null` — the company's own VAT number is not attached to Stripe
   invoices/receipts.
4. `business_type: "individual"` does not match `AUTOWEB COMMERCE SAS`. This is the test-mode
   account object (`livemode: false`), so it may differ in live mode — but it is worth checking in
   the Dashboard, because a Stripe account still registered as an individual while the seller is
   an SAS is a payout/KYC problem independent of this job.
5. The head office `line2` is stored in Stripe as `"Aprtment 21"` — a typo, and English. Cosmetic,
   but it appears on Stripe-generated documents.

**Decision needed (not taken here, per the spec's "do NOT change pricing logic without
confirmation"):** since displayed prices are now TTC-inclusive, the technically correct Stripe
setup is `tax_behavior: 'inclusive'` on every `price_data` plus `automatic_tax: { enabled: true }`
plus an FR registration — which would make Stripe split out the 20 % itself and leave the
customer's total unchanged. That is a change to the payment path and needs explicit sign-off; it
is listed in §12 as a recommendation, not implemented.

### 2.4 Where `293 B` / `TVA non applicable` renders today

| File:line | Surface | Text |
|---|---|---|
| `components/Footer.tsx:84` | every page | `Paiement sécurisé Stripe · TVA non applicable, art. 293 B du CGI` |
| `app/cart/page.tsx:394` | /cart | `Paiement sécurisé Stripe · TVA non applicable, art. 293 B du CGI` |
| `app/checkout/page.tsx:57` | /checkout | `Paiement traité par Stripe · TVA non applicable, art. 293 B du CGI` |
| `app/cgv/page.tsx:77` | /cgv art. 3 | `La TVA n'est pas applicable, conformément à l'article 293 B du Code général des impôts.` |

Not present in any email, and there are no invoices, so those two surfaces named by the spec are
vacuously clean. No Stripe receipt custom text is set from code (`stripe.checkout.sessions.create`
sets no `custom_text`), but the Dashboard receipt footer must be checked manually for the same
sentence.

---

## 3. TASK 3 — footer

Current bottom row (`components/Footer.tsx:74-87`):

```
© {year} Souqify — souqify.fr        CGV · Cookies & vie privée · Paiement sécurisé Stripe · TVA non applicable, art. 293 B du CGI
```

Missing relative to the spec: legal name, SIREN, VAT number, head office, and the links to
Mentions légales, Confidentialité, Cookies (separate from Confidentialité), Transparence &
affiliation, Rétractation. The vidaXL non-affiliation line is absent everywhere on the site.

**"Gérer mes cookies" link — check first result: there is no consent tool to reopen.**
`components/CookieNotice.tsx` is a *disclosure* banner: it has a single "Compris" button that
writes `localStorage['souqify-cookie-notice-dismissed'] = '1'` and hides itself. There is no
accept/refuse state, no consent object, no category toggles, and nothing reads that key except the
banner itself. Its own header comment says so explicitly (lines 9-14): "Not a consent gate —
there's nothing on this site that needs opt-in."

That reasoning is correct *today* (Vercel Web Analytics is cookieless) and becomes **incorrect the
moment GA4 lands** (Task 7). So Task 3's "Gérer mes cookies" link and Task 7's GA4 are the same
piece of work: `CookieNotice` has to become a real consent gate first. Flagged as a sequencing
dependency, not a contradiction.

---

## 4. TASK 4 — pages

| Route | Exists? | Notes |
|---|---|---|
| `/mentions-legales` | **No** | Not in `app/`. Mandatory under LCEN art. 6-III. |
| `/cgv` | Yes, `app/cgv/page.tsx` | 11 sections. Carries the "Brouillon de travail" banner at line 36-42. Will be fully replaced by spec Section B. |
| `/retractation` | **No** | The withdrawal form (annex) exists nowhere; CGV art. 6 only gives an email address. |
| `/transparence-affiliation` | **No** | Nothing affiliate-related exists in the repo at all. |
| `/politique-confidentialite` | **No** | See §4.1. |
| `/politique-cookies` | Yes, `app/politique-cookies/page.tsx` | 5 sections, cookie-scoped only. |

Metadata state of the two existing legal pages:

- `app/cgv/page.tsx:4-6` — `title` only, **no `description`**. It therefore inherits the root
  layout's homepage description (`app/layout.tsx:44-45`, "Jardin, mobilier, déco et jardinage
  vidaXL à Bondues (59), à moitié prix…"). Confirms the spec's claim.
- `app/politique-cookies/page.tsx:4-7` — has its own `title` + `description`. Already fine.
- Neither has `alternates.canonical`, neither has an explicit `robots` (they inherit
  `index: true, follow: true` from the root layout, which is what the spec wants).
- Neither shows a stable `lastUpdated`: both render
  `En vigueur au {new Date().toLocaleDateString('fr-FR', …)}` — **the current date, recomputed on
  every request**. A CGV that claims to have come into force today, every day, is worse than no
  date: it destroys the ability to prove which version a given customer accepted. This is why the
  spec puts `cgvVersionDate` in `COMPANY`.
- Neither has a printable layout (`@media print` rules do not exist anywhere; `app/globals.css`
  has no print block).

### 4.1 `/politique-confidentialite` — does `/politique-cookies` already cover privacy?

**No. It covers cookies well and privacy barely.** What `app/politique-cookies/page.tsx` has:

- ✅ Cookie inventory with names, purposes, durations (`authjs.*`, `__stripe_mid/_sid`)
- ✅ localStorage/sessionStorage disclosure
- ✅ Vercel Web Analytics described as cookieless, processed by Vercel Inc.
- ✅ Google sign-in cookies mentioned, with a link to Google's policy
- ✅ A one-line rights sentence: accès, rectification, suppression → `contact@souqify.fr`

Measured against the list in the spec, **missing**:

| Mandatory item | Present? | Note |
|---|---|---|
| Identity of the data controller | ❌ | "Souqify" is named as a brand; the legal entity, its head office and a contact are never given |
| DPO / contact for data matters | ❌ | only a generic mailbox, not identified as the privacy contact |
| Purposes of processing | ❌ (partial) | cookies only; order fulfilment, account management, delivery, marketing emails are never described as purposes |
| Legal basis per purpose | ❌ | art. 6 RGPD bases (contract / legal obligation / consent / legitimate interest) appear nowhere |
| Retention periods | ❌ | no duration for orders, accounts, or the notification list. (French commercial law requires invoices kept 10 years; nothing says so) |
| Recipients / sub-processors | ❌ (partial) | Vercel and Google are named; **Stripe, Resend, Mondial Relay, Cocolis, MongoDB Atlas and UploadThing are not**, although all six receive personal data |
| Transfers outside the EU | ❌ | not mentioned at all. Resend (US), MongoDB Atlas (region unverified), Vercel (US parent), UploadThing (US) are all relevant |
| Full rights list | ❌ (partial) | has accès/rectification/effacement; **missing** limitation, opposition, portabilité, retrait du consentement, directives post-mortem |
| Right to complain to the CNIL | ❌ | absent, and it is explicitly mandatory (art. 13-2-d RGPD) |
| Automated decision-making statement | ❌ | absent (answer is "none", but it should be said) |
| Source of data / obligatory-or-optional nature of fields | ❌ | absent |

Additional factual gaps found by reading the code rather than the page:

- `lib/schemas/NotificationSubscriber.ts` — a marketing email list exists (`/api/notifications/subscribe`, blasted by `sendNewArrivalNotifications`). The cookie policy never mentions it. Consent, retention and unsubscribe need documenting.
- `lib/schemas/Favorite.ts` — favourites are stored server-side per user. Undocumented.
- `app/api/checkout/create-session/route.ts:75-79` silently **writes the checkout form back onto the user's account** (`User.findByIdAndUpdate` with name/phone/address). That is a real processing operation, undisclosed.
- Order records carry `customerPhone` and a full postal address; nothing says for how long.

Per the spec's instruction ("Report gaps; do not write legal text beyond what is listed"), I have
**not** drafted a privacy policy. The gap list above is the deliverable for this route. Writing
`/politique-confidentialite` needs a Phase 1.5 decision: the content is genuinely new legal text,
not a rearrangement of what exists.

### 4.2 Checkout checks tied to the CGV

| Check | State |
|---|---|
| Mandatory unchecked CGV checkbox before payment | **Absent.** `app/cart/page.tsx` has no checkbox of any kind. `customerComplete` (line 77-78) gates the button on name/phone/address only. `/checkout` is just Stripe's embedded iframe. |
| Button wording makes payment obligation explicit | **Partial.** The site's own button reads `Payer maintenant` (`app/cart/page.tsx:384`), which is acceptable under L221-14 ("Payer"), but it does **not** place the order — it creates the session and routes to `/checkout`. The button that actually forms the contract is Stripe's own embedded submit button, whose label comes from Stripe (`submit_type` is not set in `create-session/route.ts`). Worth setting explicitly. |
| Confirmation email links the CGV version in force | **Absent** — no confirmation email at all (§2.2), and `lib/schemas/Order.ts` has no `cgvVersionDate` field. |

There is consequently **no record anywhere of which CGV version any past customer accepted**, and
no record that they accepted at all. The current CGV page compounds this by re-dating itself
daily (§4).

---

## 5. TASK 5 — content section `/guides`

Nothing exists. No `content/` directory, no `/guides` route, no MDX anywhere.

Tooling that has to be added (none of it is installed — verified against `node_modules/`):

| Package | Status | For |
|---|---|---|
| `zod` | absent | frontmatter validation (spec requires build-time failure) |
| `@next/mdx` / `@mdx-js/react` / `@mdx-js/loader` | absent | MDX compilation |
| `gray-matter` | absent | frontmatter parsing for the hub listing |
| `remark-gfm` etc. | absent | tables in MDX (needed by `<ComparisonTable />` prose around it) |

Current nav surfaces that must gain a "Guides" entry:

- `components/Header.tsx` — **has no nav links at all.** Its header comment (lines 13-15) records
  a deliberate decision: the category tab row was removed and `StockManifest` is "the only
  navigation instrument". Adding a "Guides" link means partially reversing that decision. Flagged
  as a design call for Nasim, not something to do silently — see §9.3.
- `components/Footer.tsx:50-71` — "Boutique" column, easy to extend or sit alongside.
- `app/sitemap.ts` — currently home + `/cgv` + `/politique-cookies` + categories + sellable products.

---

## 6. TASK 6 — product components in MDX

`components/ProductCard.tsx` is **not a component** — it exports only the `CatalogProduct`
TypeScript interface (14 lines, no JSX). The real cards are:

- `components/TicketRow.tsx` — the gallery card ("Galerie" mode), a client component using `useCart`, `PriceMark`, `FavoriteButton`.
- `components/RegistreRow.tsx` — the list-mode row.
- `components/ProductGrid.tsx:141` picks between them from `useViewMode()`.

So "reuse existing product card" (spec Task 5, item 6) means reusing `TicketRow`. It is
`'use client'` and calls `useCart()`, which works inside a server-rendered guide page as long as
the strip is a client boundary. `PriceMark` will need checking for the −50 % styling the spec
forbids on affiliate cards — that styling lives in `components/PriceMark.tsx`, not in the card.

For `<OwnProduct id="…" />`: products are fetched via `lib/catalog.ts` or `Product.findOne`.
Note both `app/page.tsx:8` and `app/product/[slug]/page.tsx:16` set `export const dynamic =
'force-dynamic'`, so the codebase currently does no ISR at all. Guides can introduce `revalidate`
safely (they are a new route), but it will be the first ISR in the project.

`/product/[slug]` 404s for anything not `status: 'sellable'` (`app/product/[slug]/page.tsx:20`),
which is exactly why the spec demands the sold-out fallback instead of a dead card. Confirmed
necessary.

---

## 7. TASK 7 — analytics and consent

**Which analytics exist today:** exactly one, Vercel Web Analytics.
`app/layout.tsx:2` imports `Analytics` from `@vercel/analytics/next`; rendered at line 82.
`package.json` has `"@vercel/analytics": "^2.0.1"`. No GA4, no gtag, no Google Tag Manager, no
Meta Pixel, no Plausible, no Matomo — `grep -rn "gtag\|dataLayer\|GTM-\|G-[A-Z0-9]\|analytics.js"`
over `app/ components/ lib/` returns nothing but the Vercel import.

**Which consent tool exists today:** none. `components/CookieNotice.tsx` is disclosure-only, see
§3. No CMP (Axeptio, Didomi, Cookiebot, tarteaucitron) is installed.

**Server-side click storage:** `/api/track/affiliate-click` does not exist; there is no
`affiliate_clicks` collection and no rate-limiting utility anywhere in the repo (checked
`lib/` — no `rateLimit`, no `@upstash/ratelimit`, no in-memory limiter). Rate limiting will be
built from scratch; note the app runs on Vercel Fluid Compute (`vercel.json` region `cdg1`), so a
per-instance in-memory limiter is best-effort only across concurrent instances.

**Blocking value:** GA4 needs a measurement ID. `NEXT_PUBLIC_GA_ID` is not in `.env.local` nor in
`.env.local.template`. Added to §11.

**Consequence of adding GA4, stated plainly:** GA4 writes `_ga` cookies and is a non-essential
tracker, so it requires prior opt-in consent under art. 82 of the loi Informatique et Libertés.
That means `CookieNotice` must be rebuilt into a real accept/refuse gate, `politique-cookies` must
gain a GA4 row and describe the consent mechanism, and the current claim on that page —
"{Souqify} n'utilise aucun cookie publicitaire […] aucun outil comme Google Analytics" — becomes
false and must be rewritten. Task 7 therefore cannot be done without touching Task 3's cookie
surface and the cookie policy page. Sequenced accordingly.

---

## 8. TASK 8 — SEO baseline

| Item | State |
|---|---|
| Per-page meta descriptions | `/cgv` has none (inherits homepage). `/politique-cookies` has its own. Product pages and category pages have their own. |
| Homepage title | `Souqify — Mobilier & déco vidaXL à −50 %` (`app/layout.tsx:41`). Presents vidaXL as the headline noun. |
| Homepage description | `Jardin, mobilier, déco et jardinage vidaXL à Bondues (59), à moitié prix…` (`app/layout.tsx:44-45`) |
| Twitter card | `card: 'summary'` at root (`app/layout.tsx:51-53`). Product pages upgrade to `summary_large_image` **only when the product has a photo** (`app/product/[slug]/page.tsx:48`). |
| OG image | **None.** No `opengraph-image.*`, no `app/icon.*`, no `apple-icon.*`; `public/` contains only `placeholder.png`. Every share of the homepage is imageless. |
| Canonicals | Homepage `/` only (`app/page.tsx:46`) and product pages (`:38`). Legal pages: none. |
| `metadataBase` | set, `https://www.souqify.fr` (`app/layout.tsx:39`) |

Also found: `vidaXL` appears in 5 user-facing strings (`app/layout.tsx:41,45`, `app/page.tsx:34,35`,
`components/Footer.tsx:17`) plus a dynamic one in `lib/drop.ts:36` which only names the brand when
it is >50 % of remaining stock — that one is already conditional and honest, and needs no change.

### Category URLs — how `/?category=…` is indexed today (report only, no change)

1. **They are in the sitemap as query-string URLs.** `app/sitemap.ts:25-29` emits
   `https://www.souqify.fr/?category=Jardin%20%26%20Ext%C3%A9rieur` and four siblings, at
   `priority: 0.6`, `changeFrequency: 'daily'`.
2. **They are crawlable.** `app/robots.ts` disallows `/api/`, `/admin`, `/ayooshi`, `/account`,
   `/cart`, `/checkout`, `/success`, `/login`, `/register`, `/verify-email`, `/debug` — no query
   rules, so `/?category=…` is allowed.
3. **They self-canonicalize.** `app/page.tsx:36-41` deliberately omits `alternates.canonical` for
   category views, with a comment explaining why: Next's URL resolver collapses `'/'` to the bare
   origin and silently drops the query string, which would point every category at the homepage.
   The bare homepage (no category) does emit `canonical: '/'` (line 46).
4. **Facet-filtered views are noindexed.** Any `search`/`priceMin`/`priceMax`/`material`/`color`
   parameter sets `robots: { index: false, follow: true }` (lines 29, 41, 47), so only the five
   fixed categories are indexable.
5. Each category gets its own title/description (lines 34-35).

Net: Google sees five indexable parameterised URLs plus the root. They share the root's HTML
`<link rel=canonical>`-less state and differ only by query string, which Google handles but treats
as weaker than a path. Migrating to `/categorie/[slug]` would be the real fix — **explicitly out
of scope for Phase 1 per the spec**, recorded here for Phase 2.

---

## 9. Where the codebase contradicts the spec

The spec says to stop and report rather than guess. Four items:

### 9.1 Guide categories do not exist in the catalogue

Task 5 groups the hub by: **Jardin & Extérieur, Piscine, Mobilier, Déco & Linge de maison, Vélo &
mobilité.**

`lib/categories.ts` — the single source of truth used by the manifest bar, listing pages, product
breadcrumbs and filters — defines: **Jardin & Extérieur, Mobilier, Jardinage, Déco & Linge de
maison, Divers.**

So `Piscine` and `Vélo & mobilité` do not exist in the catalogue, and `Jardinage` / `Divers` have
no guide category. This matters beyond the hub headings: Task 5 item 6 ("up to 4 own products from
the same category") and `<OwnProduct>`'s sold-out fallback ("linking to the category") both need a
guide category to resolve to a real `Product.category` value. A guide filed under `Piscine` would
produce an empty product strip and a link to a category page with zero results.

**Needs a decision.** Three options, cheapest first:
- (a) Use the catalogue's five categories for guides too, and drop Piscine / Vélo & mobilité.
- (b) Keep the spec's five as *editorial* categories and add an explicit `productCategory` field to
  the frontmatter that maps each guide to a real catalogue category (Piscine → Jardin & Extérieur,
  Vélo & mobilité → Divers). Guides stay SEO-shaped, product strips stay populated.
- (c) Add Piscine and Vélo & mobilité to `lib/categories.ts` — touches the manifest bar, filters
  and the sitemap for categories that currently hold zero stock.

I recommend **(b)**: it satisfies the spec's hub grouping literally, keeps product strips non-empty,
and changes nothing in the store.

### 9.2 The footer's delivery prices are already wrong

`components/Footer.tsx:44-46` states flat prices:

```
Point relais Mondial Relay — 29,99 €
À domicile par Cocolis — 79,99 €
```

`lib/shipping.ts:29-45` — which the header comment calls the "single source of truth for delivery
pricing" — makes both weight-banded: relay is 29,99 → 54,99 across four bands, home is 79,99 →
149,99 across five. The footer quotes only the cheapest band as if it were the price. A customer
with a 20 kg item is quoted 29,99 € in the footer and charged 44,99 € at checkout.

This predates Phase 1 and is not in scope, but the spec has me rewriting this exact footer, and
shipping the rewrite while leaving a misleading price two lines above it is not defensible —
especially with CGV art. 4 about to promise that delivery costs are stated before validation.
Proposed minimal fix, to confirm: change to `Point relais Mondial Relay — à partir de 29,99 €` and
`À domicile par Cocolis — à partir de 79,99 €`.

### 9.3 Header has no navigation to add "Guides" to

Task 5 says to add Guides "to header navigation". `components/Header.tsx` has no nav element: it is
logo + account + cart, and lines 13-15 document the removal of the previous category row as
intentional ("the manifest bar […] is now the only navigation instrument, not a nav plus a
decorative widget"). Adding a header link is a reversal of a recent design decision, recorded in
`fb2c42d`/`e2efacc`. Doing it is fine — but it should be Nasim's call, not a silent side effect of
a legal/content task. Footer + sitemap placement is uncontroversial and will be done regardless.

### 9.4 `[À COMPLÉTER]` versus the build gate

Task 0 requires `npm run check:legal` to **fail** if any `[À COMPLÉTER]` string would render on a
public page, and to run in CI/build. Task 1 then defines nine `[À COMPLÉTER]` values, of which at
least five are rendered directly by the mandated Section A / Section B texts (`shareCapital`,
`phone`, `mediator.*`, `deliveryDelays.*`, `cgvVersionDate`).

Taken literally, the branch cannot build until Nasim supplies those values — which also blocks the
Playwright suite in Task 9 (it needs a running build) and Lighthouse. That is the gate working as
designed, but it is worth stating before it surprises anyone.

Handling: the check script is being written to fail loudly and list exactly what is missing, and
`prebuild` will run it. If the values are not available in time, the escape hatch is a single
documented env var (`LEGAL_ALLOW_INCOMPLETE=1`) that downgrades the failure to a warning *for local
dev and CI test runs only* — never set in the Vercel project. That keeps the deploy gate real while
letting the rest of Phase 1 be built and tested. Confirm if you would rather have no escape hatch
at all.

---

## 10. TASK 9 — test infrastructure

**Nothing exists.** No `@playwright/test`, no `vitest`, no `jest`, no `__tests__`, no `*.spec.ts`,
no `*.test.ts` anywhere. `package.json` has four scripts (`dev`, `build`, `start`, `lint`) and one
devDependency (`@types/bcryptjs`). There is no `.eslintrc*` either, so `npm run lint` would prompt
to configure ESLint on first run.

Everything in Task 9 is greenfield:

| Requirement | Needs |
|---|---|
| Playwright page assertions | `@playwright/test` + browsers (`npx playwright install` — network download, ~400 MB) + `playwright.config.ts` + a webServer entry |
| Full Stripe test checkout E2E | Above, plus a seeded sellable product in a test DB, plus Stripe test card `4242…` in the embedded iframe. **Note:** the flow depends on the `checkout.session.completed` webhook to mark the order paid, which needs `stripe listen` forwarding or a stubbed webhook call. |
| HT/TVA/TTC unit tests | a unit runner (`vitest` recommended — zero config with the existing TS setup) |
| Lighthouse a11y ≥ 95 on a guide | `@lhci/cli` or `lighthouse` CLI, run against a built server |

Also relevant: `tsconfig.json` targets `es5` with `"strict": true`; that is fine for Vitest but
worth knowing before adding modern syntax.

---

## 11. Values still needed from Nasim (`[À COMPLÉTER]`)

These live only in `lib/company.ts` and block the legal pages from rendering.

| Key | What is needed | Blocks |
|---|---|---|
| `shareCapital` | Share capital in € as on the Kbis (e.g. "1 000 €") | Mentions légales, CGV art. 1 |
| `phone` | A customer-facing phone number. Mandatory for distance selling (L221-5). There is none on the site today. | Mentions légales, CGV art. 1 |
| `mediator.name` / `.website` / `.address` | The consumer mediator the company subscribes to (CM2C, MEDICYS, Medicys-consommation, AME…). **A paid subscription is legally required (L612-1); this cannot be invented.** | Mentions légales, CGV art. 12 |
| `deliveryDelays.pickup` | e.g. "sous 48 h ouvrées après confirmation" | CGV art. 7 |
| `deliveryDelays.mondialRelay` | e.g. "3 à 5 jours ouvrés" | CGV art. 7 |
| `deliveryDelays.cocolis` | e.g. "3 à 7 jours ouvrés" | CGV art. 7 |
| `cgvVersionDate` | The date these CGV go live. Must be fixed, not `new Date()` | CGV header, order records |
| CGV art. 7 pickup deadline | The `[À COMPLÉTER, par exemple 15]` days to book a pickup slot | CGV art. 7 |
| CGV art. 8.3 return cost | Estimated return cost in € for bulky items that cannot go by post | CGV art. 8.3 |
| `NEXT_PUBLIC_GA_ID` | GA4 measurement ID (`G-XXXXXXXXXX`), if GA4 is wanted | Task 7 |
| Amazon Associates tag | The `tag=` parameter for affiliate URLs | Task 6 sample guide |

Two more to **confirm** rather than supply:

| Key | Current value | Why confirm |
|---|---|---|
| `rcs` | `RCS Lille Métropole 100 148 469` | The spec itself marks it "to confirm against the Kbis". Wrong RCS on mentions légales is a sanctionable error. |
| `host.address` | `440 N Barranca Ave #4133, Covina, CA 91723, États-Unis` | The spec says "verify on vercel.com/legal". Vercel's registered address has changed before; LCEN requires the host's real address. |

---

## 12. Gaps recorded, deliberately not built in Phase 1

1. **Invoice generation** — no sequential numbering, no PDF, no HT/TVA/TTC document. Explicitly
   out of scope per the spec. Required for a VAT-registered company selling to consumers; French
   law also requires 10-year retention. Phase 2.
2. **Order-confirmation email** — treated as part of (1), see §2.2. Consequence: the honest
   minimum for Phase 1 is to stop `/success` claiming an email is on its way, or to confirm that
   Stripe's Dashboard receipt is enabled and reword to point at it. **Proposed: reword
   `app/success/page.tsx:79-81` and `:56-58` to reference the Stripe receipt, pending your
   confirmation that Dashboard receipts are on.** One-line change, no new infrastructure.
3. **`/politique-confidentialite`** — gap list in §4.1; the text itself is new legal drafting and
   the spec says not to write beyond what it lists.
4. **Stripe Tax wiring** (`automatic_tax` + `tax_behavior: 'inclusive'` + FR registration) —
   recommended in §2.3, not implemented, needs sign-off because it touches the payment path.
5. **Stripe account `business_type: "individual"`** — mismatch with AUTOWEB COMMERCE SAS, check
   the live-mode account in the Dashboard.
6. **Stripe Dashboard receipt footer** — must be checked manually for "TVA non applicable, art.
   293 B"; it is not readable from the repo or the API.
7. **Category URL migration** to `/categorie/[slug]` — explicitly deferred by the spec (§8).
8. **No record of CGV acceptance for past orders** — cannot be retrofitted; from Phase 1 forward
   only.

---

## 13. Files this job will touch

Listed here so the blast radius is visible before any of it happens. The definitive changed-file
list is in the final deliverable.

**New:** `lib/company.ts`, `lib/vat.ts`, `scripts/check-legal.mjs`, `app/mentions-legales/page.tsx`,
`app/retractation/page.tsx`, `app/transparence-affiliation/page.tsx`, `app/guides/page.tsx`,
`app/guides/[slug]/page.tsx`, `content/guides/exemple.mdx`, `lib/guides.ts`,
`components/legal/LegalPage.tsx`, `components/legal/LegalGuaranteeBox.tsx`,
`components/mdx/OwnProduct.tsx`, `components/mdx/AffiliateProduct.tsx`,
`components/mdx/AffiliateDisclosure.tsx`, `components/mdx/ComparisonTable.tsx`,
`app/api/track/affiliate-click/route.ts`, `lib/schemas/AffiliateClick.ts`, `lib/analytics.ts`,
tests under `tests/`.

**Modified:** `components/Footer.tsx`, `components/CookieNotice.tsx`, `app/cgv/page.tsx`
(replaced), `app/politique-cookies/page.tsx`, `app/layout.tsx`, `app/page.tsx`, `app/cart/page.tsx`,
`app/checkout/page.tsx`, `app/sitemap.ts`, `app/robots.ts`, `app/success/page.tsx` (pending §12.2),
`components/Header.tsx` (pending §9.3), `lib/schemas/Order.ts`, `package.json`, `next.config.js`,
`.env.local.template`.

**Untouched:** everything under `app/admin/`, `app/ayooshi/`, `app/api/upload*`, `lib/cj/`,
`models/`, `cj-integration-staging/`, the catalogue/cart/Stripe payment path itself.

---

# ADDENDUM: what was actually done

Written after the work, on the same branch. Sections 1 to 13 above are the
pre-change audit and are left exactly as they were.

## A. Decisions you took on the four contradictions

| § | Question | Your call |
|---|---|---|
| 9.1 | Guide categories that do not exist in the catalogue | Editorial `category` + a `productCategory` field mapping each guide to a real catalogue category. Piscine and Vélo & mobilité stay as hub headings; `lib/categories.ts` is untouched. |
| 9.3 | "Guides" in a header that has no nav | One text link next to account/cart, rendered only when at least one non-draft guide exists. The header is unchanged today, since the only guide is a draft. |
| 12.2 | The order-confirmation email | Build it. Resend, fired from the existing Stripe webhook, idempotent, with the full HT/TVA/TTC breakdown, company identity, delivery terms, withdrawal rights and the CGV version in force. No PDF invoice. |
| 2.3 | Stripe Tax | Report only. `create-session` is untouched. |

## B. Gaps that remain open

1. **Invoice generation.** No sequential number, no PDF. The confirmation email
   is the art. L221-13 written confirmation, not an invoice. Still Phase 2.
2. **`/politique-confidentialite`.** Not written, per the spec. §4.1's eleven
   missing items stand. The footer deliberately has no "Confidentialité" link
   rather than a 404 or a cookie table wearing a privacy policy's name.
3. **Stripe Tax**: no `automatic_tax`, no `tax_behavior`, no FR registration.
   Stripe still computes 0 € tax on every order. Add the registration in the
   Dashboard first; the code change is one commit after that.
4. **Stripe account `business_type: "individual"`** while the seller is an SAS.
   Check the live-mode account.
5. **Stripe Dashboard receipt footer** may still carry "TVA non applicable,
   art. 293 B". Not readable from the repo or the API; check it by hand.
6. **Category URL migration** to `/categorie/[slug]`: deferred, see §8.
7. **No record of CGV acceptance for orders placed before this branch.** Cannot
   be retrofitted.

## C. Deviations from the spec, and why

1. **`lib/company.ts` has three fields the spec's object does not**:
   `pickupBookingDays`, `bulkyReturnCost` (both rendered by the CGV text the
   spec dictates) and `legalGuaranteeBoxText`. The rule "no `[À COMPLÉTER]`
   outside `lib/company.ts`" forces them here.
2. **`check:legal` has an escape hatch**, `LEGAL_ALLOW_INCOMPLETE=1`, so the
   branch can be built and tested while §11 is outstanding. It must never be
   set on the Vercel project. It also scans `lib/`, because the order email
   reaches a customer exactly like a page does.
3. **axe-core instead of a Lighthouse score** for the accessibility gate.
   Lighthouse's score is a weighted average of these same checks and lets a
   real violation hide behind a high average. The command to reproduce the
   Lighthouse number is in `tests/e2e/accessibility.spec.ts`.
4. **`--dust` darkened from `#6E6C64` to `#605E56`.** It failed AA at 3.73:1 on
   `--paper` and 4.25:1 on `--stone`. This is a palette token, so it is the one
   change in this branch that affects the whole site; it was that or ship new
   pages failing the criterion Task 9 sets. Dark mode already passed, untouched.
5. **Footer delivery prices** now say "à partir de" (§9.2).
6. **`next-mdx-remote` could not be used.** Next 15's App Router uses a vendored
   React; a runtime MDX renderer resolves `react/jsx-runtime` from
   `node_modules`, and two React copies cannot render one tree. MDX compiles
   through `@next/mdx` instead, which also required the root
   `mdx-components.tsx`.
7. **The full Stripe checkout E2E is skipped, not faked.** It needs
   `stripe listen --forward-to localhost:3100/api/webhooks/stripe`; without the
   forward the order never reaches `paid`, because the webhook is the only
   thing that sets it. The command is in the test.

## D. Test results as of this commit

```
vitest      10 passed
playwright  24 passed · 4 failed · 1 skipped
```

The 4 failures are one assertion ("no `À COMPLÉTER` on the page") on
`/mentions-legales`, `/cgv`, `/retractation` and `/transparence-affiliation`.
They are the build gate restated over HTTP and go green the moment §11 is
answered. The skip is the full Stripe payment, see C.7.

Run them with:

```
npm run test:unit
npx playwright test              # builds and starts on :3100 itself
npm run check:legal
```

Note: `next build` currently fails on the untracked `cj-integration-staging/`
WIP, which `tsconfig` picks up (`Cannot find module '@/models/Order'`). It is
unrelated to this branch and was moved aside for each build here, never
modified. Either finish it, add it to `tsconfig.exclude`, or keep it outside
the project directory.

## E. Still needed from you

Unchanged from §11, plus one more that emerged while writing the CGV:

| Key | What |
|---|---|
| `shareCapital` | Share capital per the Kbis |
| `phone` | Customer-facing number, mandatory for distance selling (L221-5) |
| `mediator.name` / `.website` / `.address` | The mediator you subscribe to. A paid subscription is legally required (L612-1) and cannot be invented |
| `deliveryDelays.pickup` / `.mondialRelay` / `.cocolis` | Three delivery delays |
| `cgvVersionDate` | The date these terms go live. Fixed, never `new Date()` |
| `pickupBookingDays` | CGV art. 7, days to book a collection slot |
| `bulkyReturnCost` | CGV art. 8.3, estimated return cost for bulky items |
| `legalGuaranteeBoxText` | **New.** The encadré from the annexe to décret n° 2022-424, copied from Légifrance verbatim, never paraphrased |
| `NEXT_PUBLIC_GA_ID` | Only if you want GA4. Without it no Google script loads and the banner stays informational |
| Amazon Associates tag | The real `tag=` for affiliate URLs, currently `VOTRE-TAG-ICI` in the sample guide |

To confirm rather than supply: `rcs` (against the Kbis) and `host.address`
(against vercel.com/legal).
