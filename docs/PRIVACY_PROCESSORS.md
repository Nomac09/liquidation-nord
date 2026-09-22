# Privacy policy: the processor list, checked against the code

Written for Phase 1B Task 5, which says to adapt the draft processor list to what
actually exists in the repo and to report every change. This is that report.

Audited at commit `30942f8` on `phase1-legal-affiliate`, 2026-09-22.

---

## 1. What the draft listed, and what the code says

| Draft entry | Verdict | Evidence |
|---|---|---|
| Stripe (paiement) | **Kept, unchanged** | `lib/stripe.ts`, `app/api/checkout/create-session/route.ts` (embedded Checkout), `app/api/webhooks/stripe/route.ts`. Card data never reaches us. |
| Resend (emails transactionnels) | **Kept, widened** | `lib/email.ts`. It sends the verification email, the order confirmation **and** the new-arrivals alerts, so the entry now says "et des alertes nouveautés". |
| Mondial Relay et Cocolis (livraison) | **Kept, reworded** | `app/api/shipping/mondial/route.ts` and `app/api/shipping/cocolis/route.ts` are stubs: they return hardcoded values and call no external API. No personal data is transmitted to either carrier *by the application*. The address does reach them when a parcel is actually handed over, so the entry stays, worded as "le transporteur reçoit les informations nécessaires à la remise du colis au moment de l'expédition" rather than implying a live integration. |
| Vercel (hébergement) | **Kept, widened** | Hosting, plus `@vercel/analytics` (`components/…`, package.json). Vercel Web Analytics is cookieless but it is still Vercel processing visit data, and `/politique-cookies` already discloses it. Entry now reads "hébergement du site et mesure d'audience sans cookie". |
| MongoDB (base de données) | **Kept, made precise** | `lib/mongodb.ts` reads `MONGODB_URI`; the configured value is a **MongoDB Atlas** `mongodb+srv://` cluster. Entry now says "MongoDB Atlas". |
| Google (mesure d'audience, seulement si vous l'acceptez) | **Kept, and a second role added** | `components/analytics/GoogleAnalytics.tsx` is consent-gated on `NEXT_PUBLIC_GA_ID`. But `auth.ts` has also had a **Google OAuth provider** all along, so Google is a recipient for anyone who signs in with a Google account, consent to analytics or not. That half is unconditional; the analytics half renders only when a measurement ID exists. |

## 2. Added — present in the code, absent from the draft

1. **Google as an identity provider.** See above. The draft would have told a
   Google-signed-in customer that Google only sees them if they accept cookies.

2. **The new-arrivals alert list.** `lib/schemas/NotificationSubscriber.ts` and
   `app/api/notifications/subscribe/route.ts` store an email address, the chosen
   categories, an optional `userId` and an unsubscribe token. None of it was in
   §2 (data collected), §3 (purpose and basis) or §6 (retention). It is now in all
   three, on a consent basis, with "until you unsubscribe" as the retention rule.

3. **What a customer account actually holds.** The draft said "email et
   informations de connexion". `lib/schemas/User.ts` also holds name, phone and a
   full postal address, which `create-session` writes back at every checkout, plus
   `image` for Google accounts. `lib/schemas/Favorite.ts` stores favourites per
   account. §2 now says so, and says the password is kept only as a bcrypt hash.

4. **The affiliate-click rate limiter.** `app/api/track/affiliate-click/route.ts`
   hashes `x-forwarded-for` with a per-instance random salt that is never
   persisted, keeps it only in an in-memory bucket, and stores none of it on the
   click record (`lib/schemas/AffiliateClick.ts` holds no IP, no user agent, no
   session). Nothing is retained, but an IP address is personal data the moment it
   is processed, so §2 discloses it and §3 gives its basis (legitimate interest,
   preventing automated abuse).

5. **Account and email-verification handling** as an explicit purpose in §3. The
   draft's bases covered orders, accounting, fraud and measurement but not "you
   asked us to keep an account for you".

## 3. Removed — in the draft, not in the code

Nothing was removed. Every provider the draft named is genuinely in use, once
Mondial Relay and Cocolis are read as "the carriers we hand parcels to" rather
than "APIs we call".

## 4. Considered and deliberately left out

- **UploadThing** (`lib/uploadthing.ts`, `app/api/uploadthing/route.ts`,
  `app/api/upload-images-bulk/route.ts`). It stores product photographs uploaded
  by us from the admin pages. No buyer data passes through it, so it is not a
  recipient of personal data and does not belong on a list of who can see yours.
  Worth knowing anyway: its token is configured for the `sea1` region
  (Singapore). If it is ever used for anything with a person in it, it becomes a
  §4 recipient **and** a §5 transfer.

- **Vercel OIDC / build tooling, Playwright, Vitest.** Development only.

## 5. Open questions, for you rather than for the code

1. **Atlas region.** `lib/mongodb.ts` cannot tell you where the cluster lives, and
   the `mongodb+srv` hostname does not encode it. The cluster's shard resolves to
   an IP that geolocates to Paris and is announced by MongoDB, Inc., which is
   consistent with an EU region, but that is an inference from DNS, not a fact
   from the console. **Confirm it in the Atlas UI.** If the cluster is outside the
   EU, MongoDB has to be added to §5 (transfers) alongside Stripe, Vercel, Resend
   and Google.

2. **GA4 data retention: set it to 14 months.** This is an admin setting, not
   code: Google Analytics 4 → Admin → Data collection and modification → Data
   retention → "Event data retention: 14 months". The default on a new property is
   2 months on some setups and 14 on others, and the policy's §6 states 14, so it
   has to be set deliberately rather than assumed. It only applies once
   `NEXT_PUBLIC_GA_ID` exists; today it does not, and §6 omits the line entirely.

3. **Subcontractor agreements (art. 28 RGPD).** Each processor above needs a DPA
   on file. Stripe, Vercel, Resend, Google and MongoDB all publish one that is
   accepted with the terms of service; Mondial Relay and Cocolis will need
   checking when those accounts are opened.

4. **Service-client exchanges: 3 years.** §6 promises it. Nothing in the code
   deletes anything, ever. There is no retention job for orders (10 years), for
   dormant accounts (3 years) or for the alerts list. The policy states the rule;
   somebody still has to enforce it. Phase 2.
