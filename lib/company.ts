// Single source of truth for who legally sells on this site.
//
// Every page, component and email that states company identity reads from
// here. Nothing below may be duplicated as a literal anywhere else: the
// whole point is that a wrong SIRET or a stale address is fixed in one
// place, not hunted across a dozen JSX files.
//
// Values still marked with PLACEHOLDER_MARKER are genuinely unknown, not
// forgotten. They must never be invented: a wrong RCS or a made-up
// mediator on a mentions légales page is a sanctionable statement, not a
// typo. `npm run check:legal` fails the build if any of them would reach
// a public page. See docs/PHASE1_AUDIT.md §11 for who supplies what.

export const PLACEHOLDER_MARKER = '[À COMPLÉTER'

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

  // Two more figures the CGV text itself needs. They are here rather than
  // inline in the CGV page for the same reason as everything above: the
  // rule is that no [À COMPLÉTER] lives outside this file.
  // - pickupBookingDays: CGV art. 7, how long the buyer has to book a
  //   collection slot before the order can be cancelled and refunded.
  // - bulkyReturnCost: CGV art. 8.3, the estimated cost of returning an
  //   item too large or heavy to go back by post. Required by L221-5:
  //   without it, the buyer does not owe that cost at all.
  pickupBookingDays: "[À COMPLÉTER]",
  bulkyReturnCost: "[À COMPLÉTER]",

  // CGV art. 9. The encadré on the garantie légale de conformité and the
  // garantie des vices cachés is imposed word for word by the annexe to
  // décret n° 2022-424 du 25 mars 2022. It must be COPIED from Légifrance,
  // never paraphrased and never written from memory: the wording is the
  // legal obligation, and an approximation of it is a breach dressed up as
  // compliance. Paste the official text here, in full, and the build gate
  // will stop complaining.
  legalGuaranteeBoxText:
    "[À COMPLÉTER: encadré officiel, annexe du décret n° 2022-424 du 25 mars 2022, à copier depuis Légifrance sans le réécrire]",
} as const

/** True when a value is still an unfilled placeholder. */
export function isPlaceholder(value: string): boolean {
  return value.includes(PLACEHOLDER_MARKER)
}

/**
 * The head office on one line. `withCountry` is the form used in legal
 * prose ("Siège social : …, France"); without it is the compact form for
 * the footer, where the country is already obvious from context.
 */
export function formatHeadOffice({ withCountry = false } = {}): string {
  const { line1, postalCode, city, country } = COMPANY.headOffice
  const base = `${line1}, ${postalCode} ${city}`
  return withCountry ? `${base}, ${country}` : base
}

/** "SIREN 100 148 469 · TVA FR44100148469" */
export function formatIdentifiers(): string {
  return `SIREN ${COMPANY.siren} · TVA ${COMPANY.vatNumber}`
}

/** The TVA rate as shown in copy: "20 %". */
export const VAT_RATE_LABEL = `${Math.round(COMPANY.vat.standardRate * 100)} %`

/** Sitewide price/payment reassurance line. Task 2 replaced the 293 B one. */
export const PRICE_NOTICE = `Prix TTC, TVA ${VAT_RATE_LABEL} incluse · Paiement sécurisé Stripe`

/** Non-affiliation notice, required wherever the vidaXL name is used. */
export const VIDAXL_DISCLAIMER =
  "Souqify n'est pas affilié à vidaXL. Les marques citées appartiennent à leurs propriétaires."
