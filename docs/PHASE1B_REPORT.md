# PHASE 1B — what was built, what it found, what still blocks production

Branch `phase1-legal-affiliate`, eight commits on top of `1f22b80`, not deployed.

| Commit | Task |
|---|---|
| `b10b410` | 1 — fill `lib/company.ts`, and the build gate that keeps it filled |
| `a472455` | 2 — a delivery promise computed per article and per mode |
| `18ccc7c` | 3 — return cost estimated per article |
| `30942f8` | 4 — CGV articles 4, 9 and 12 |
| `aa31bce` | 5 — `/politique-confidentialite` |
| `eb888bc` | 6 — one price, and it is the one charged |
| `a8011d9` | 7 — a comparison price with a source and a date, or none at all |
| `038ef40` | 8 — tests, and the gate armed for real |

```
vitest      69 passed
playwright  37 passed · 1 skipped · 0 failed
check:legal OK with NEXT_PUBLIC_CGV_VERSION_DATE, exit 1 without it
```

Phase 1 left four failing Playwright assertions waiting on values that did not
exist yet. They are green. The one skip is still the full Stripe payment, which
needs `stripe listen --forward-to localhost:3100/api/webhooks/stripe`.

---

## 1. The "check first" answers

### Task 7 — how the crossed-out price was stored

- **Field:** `rrp` on `lib/schemas/Product.ts`, `Number`, required.
- **Source:** the `RRP` column of the supplier XLSX, read at
  `app/api/upload-xlsx/route.ts:45-46`. Nothing records which retailer, if any,
  ever charged it.
- **Date:** none. There was no observation date anywhere in the model.
- **Sale price:** derived at import, `Math.round(rrp * (rrp > 500 ? 0.4 : 0.5))`.
  A flat 50 %, or 60 % above 500 €, applied to every article regardless of its
  condition, rounded to the whole euro.
- **Purchase cost per unit:** not stored. `unitCost` did not exist.

So the site was rendering a struck-through figure with no provenance next to a
computed "−50 %". Struck-through plus a percentage reads as *this is what it used
to cost here*, and that reading is a reduction announcement, which art. L112-1-1
only permits against our own lowest price of the previous 30 days. We never had
one. That is the reason the whole display changed, not a preference.

### Task 5 — the processor list

Full report, with evidence per line, in **`docs/PRIVACY_PROCESSORS.md`**. Nothing
in the draft was removed; six entries were corrected and five things the code
does were added, the largest being that Google is a recipient for sign-in as well
as for analytics, and that the new-arrivals alert list was not disclosed at all.

---

## 2. Where the spec and the code disagreed

None of these stopped the work. Each was resolved in the direction the code
already went, and is noted here because the spec says one thing and the
repository another.

1. **Mode names.** The spec says `pickup` / `mondialRelay` / `cocolis`. The code
   has had `pickup` / `relay` / `home` since before this branch, in
   `SHIPPING_METHODS`, the `Order` enum and the checkout route. `relay` is Mondial
   Relay and `home` is Cocolis; `lib/delivery.ts` maps between them rather than
   renaming an enum that three stored fields depend on.

2. **"Too heavy *or bulky* for relay."** Only weight is recorded. `dimensions` is
   a free-text string, unparsed and often empty. Relay eligibility is therefore
   the existing `RELAY_MAX_KG` weight test, exactly as `getShippingQuotes`
   already decides it. A genuinely bulky but light article — a 4 m parasol — is
   currently treated as relay-eligible and is not.

3. **The TVA split contradicted `lib/vat.ts`.** The spec fixes
   `vatAmount = round(amountTTC / 6, 2)`; Phase 1 rounded the HT and took the TVA
   as the remainder. They disagree by a cent on roughly one amount in six
   (12,09 € is 2,01 € one way, 2,02 € the other). The spec's direction was
   implemented, because the TVA is the figure that gets declared and so should be
   the one computed rather than inferred. `tests/unit/vat.test.ts` now pins it.

4. **"Linked in the checkout."** The CGV checkbox is on `/cart`, not `/checkout`;
   `/checkout` is the embedded Stripe frame, and consent is given before it. The
   privacy-policy link went next to the CGV checkbox on `/cart`, and the E2E test
   checks it there.

5. **"Always add 'Retour gratuit si vous le rapportez à l'entrepôt.'"** The bulky
   label already ends with that sentence, in more words. `returnCostLines()` adds
   the short form only when the label does not already carry it; the note is
   always present on the estimate object.

6. **Mondial Relay and Cocolis are not integrated.** Their API routes are stubs
   returning hardcoded values. This matters to the privacy policy's recipient
   list, which is worded for what actually happens.

7. **Articles 7 and 8.3 of the CGV moved to the Task 1 commit.** Removing
   `deliveryDelays` and `bulkyReturnCost` from `lib/company.ts` broke the JSX that
   rendered them, so they had to be rewritten in the same commit. The wording is
   the one Task 4 dictates. The same applies to the guarantee-box text, which
   Task 4 specifies but which Task 1 had to fill, since it was the last
   placeholder standing between the branch and a green `check:legal`.

---

## 3. Blockers for production

Ordered by what stops a deploy first.

### 3.1 Set `NEXT_PUBLIC_CGV_VERSION_DATE` on the Vercel project

The build fails without it, by design. Set it once, at the first production
deploy, to the date the terms come into force — for example `1er octobre 2026`.
It is the date printed on the CGV, the mentions légales, the cookie policy, the
privacy policy and the rétractation page, and it is pinned onto every order at
checkout. **Never change it without publishing new terms**: doing so rewrites the
stated version of documents past buyers agreed to.

`LEGAL_ALLOW_INCOMPLETE` must not exist on the Vercel project.

### 3.2 `cj-integration-staging/` still breaks `next build`

Unchanged from Phase 1 §D. The untracked WIP is picked up by `tsconfig.include`
and fails with `Cannot find module '@/models/Order'`. It was moved aside for each
build in this branch and never modified. Finish it, add it to `tsconfig.exclude`,
or keep it outside the project directory. It is not this branch's to decide.

### 3.3 The repricing run has not been applied, and needs two decisions first

`docs/REPRICE_DRY_RUN.md`, 711 articles, nothing written. Before `--apply`:

1. **Every price goes up.** 39 742 € of stock value becomes 47 504 €, +19,5 %.
   Not a bug in the grid: today's prices are a flat 50 % off the manifest's RRP,
   and the grid's default for an open-box article is 40 %.
   `npm run reprice -- --default=defaut-signale` (50 %) stays near today's prices.
2. **All 711 articles have an empty `condition`.** Every one of them took the
   default and is flagged `⚠︎` in the report. A discount grid applied to stock
   whose condition nothing records is a guess with a table around it. The real
   fix is to record the condition; there is no code that can substitute for it.

### 3.4 No comparison price or badge renders anywhere today

By design, and worth stating plainly so it is not mistaken for a regression: a
comparison is shown only with a source, an observation date, and a date under 90
days old. None of the 711 articles has one. Until someone actually checks prices
at vidaXL.fr and runs `npm run reprice -- --apply --checked-at=YYYY-MM-DD`, every
product page shows the Souqify price alone.

That is the correct state. The alternative is to keep making an undated claim.

### 3.5 The XLSX importer bypasses all of this, and wipes weights

`app/api/upload-xlsx/route.ts` still computes `salePrice = round(rrp * 0.4|0.5)`
and knows nothing about the grid, `comparePrice` or `discountPercent`. Worse, for
an article that already exists it does:

```ts
await Product.updateOne({ ean: productData.ean }, { $set: productData })
```

where `productData` contains `weight: 0`, `photos: []`, `condition: ''`,
`dimensions: ''` and `inspected: false`. **Re-importing a sheet therefore wipes
the weight and the photographs of every article already in the catalogue.** That
was true before this branch; it matters more now, because weight is what decides
the delivery promise, relay eligibility and the return cost estimate. A re-import
today would silently turn every article into a 0 kg relay parcel with a 29,99 €
return estimate.

Out of scope here, deliberately untouched, but it should be the next thing fixed.

### 3.6 The mediator subscription must actually exist

CM2C's name, address and website are now on the CGV and the mentions légales,
from the values the spec supplied. Art. L612-1 requires an actual paid
subscription to the scheme, not merely naming one. Confirm the subscription is
live before the site takes an order, because the page now asserts it.

### 3.7 Confirm the MongoDB Atlas region

The privacy policy's §5 lists Stripe, Vercel, Resend and Google as processing in
the United States. The database is MongoDB Atlas; the cluster's shard resolves to
an IP announced by MongoDB, Inc. and geolocated in Paris, which is consistent
with an EU region, but that is an inference from DNS, not a fact from the
console. Check it in the Atlas UI. If the cluster is outside the EU, MongoDB
belongs in §5.

### 3.8 GA4 data retention, when GA4 arrives

`NEXT_PUBLIC_GA_ID` is not set, so no Google Analytics loads and the privacy
policy and cookie policy both describe the cookieless measurement that actually
runs. When the measurement ID is added, set **Admin → Data collection and
modification → Data retention → Event data retention: 14 months**, which is what
§6 of the privacy policy states. It is an admin setting; no code enforces it.

### 3.9 `unitCost` is empty, so the margin floor is inert

The floor works and is tested, but it has nothing to compare against: no article
records what it cost. Every row in the dry run reads `coût inconnu`, and the
floor blocked zero repricings. Until costs are recorded, the grid can price an
article below what it cost and nothing will notice.

### 3.10 Still open from Phase 1

Unchanged, and repeated here so the list is in one place:

1. No invoice generation — no sequential number, no PDF. The confirmation email
   is the art. L221-13 written confirmation, not an invoice.
2. Stripe Tax: no `automatic_tax`, no `tax_behavior`, no FR registration. Stripe
   computes 0 € tax on every order.
3. Stripe account `business_type: "individual"` while the seller is an SAS.
4. The Stripe Dashboard receipt footer may still carry "TVA non applicable,
   art. 293 B". Not readable from the repo; check it by hand.
5. No record of CGV acceptance for orders placed before this branch.
6. No retention job. `/politique-confidentialite` §6 promises 10 years for
   orders, 3 years for service-client exchanges and dormant accounts. Nothing in
   the code deletes anything, ever.
7. `rcs` is still "to confirm against the Kbis", and `host.address` against
   vercel.com/legal.

---

## 4. Things worth knowing that are not blockers

- **`discountPercent` is editable per product** in the data model, as the spec
  asks, but there is no admin screen for it. It is a Mongo field today.
- **Public holidays** are computed, including the movable feasts, so a "jours
  ouvrés" promise made in April or May is one we can keep. Not in the spec; a
  weekend-only counter under-promises by one to three days in those months.
- **`rrp` is kept, not deleted.** It is no longer rendered anywhere, but it is the
  only record of what the supplier sheet said, and Task 7 says to add fields
  rather than remove them.
- **The VAT export** is at `GET /api/admin/orders/vat-export?from=&to=`, behind
  the existing `x-admin-password` header. Paid orders only, one row per taxable
  line with the delivery fee as its own line, semicolons and comma decimals with
  a BOM so a French Excel opens it correctly. Orders from before commit `eb888bc`
  have no stored breakdown and are recomputed; the `source` column says which.
