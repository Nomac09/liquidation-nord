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
// a public page.

export const PLACEHOLDER_MARKER = '[À COMPLÉTER'

// The CGV version date is an environment variable, not a literal, so the
// same code can be a draft locally and a dated, binding document in
// production. It is deliberately NOT `new Date()`: the date a buyer sees
// on the terms is the date those terms came into force, which is a fact
// about a deployment, not about the moment the page was rendered.
//
// Missing in production is a build failure, enforced by check:legal, not
// by a fallback here. The fallback below only exists for a local build
// that has explicitly opted out of the gate.
const CGV_VERSION_DATE_ENV = 'NEXT_PUBLIC_CGV_VERSION_DATE'
function resolveCgvVersionDate(): string {
  // Read literally rather than through a computed key: Next inlines
  // process.env.NEXT_PUBLIC_* at build time only when it can see the
  // full expression in the source.
  const fromEnv = process.env.NEXT_PUBLIC_CGV_VERSION_DATE
  if (fromEnv && fromEnv.trim()) return fromEnv.trim()
  if (process.env.LEGAL_ALLOW_INCOMPLETE === '1') return 'date de mise en ligne'
  return `${PLACEHOLDER_MARKER}: ${CGV_VERSION_DATE_ENV}]`
}

export const COMPANY = {
  tradeName: "Souqify",
  legalName: "AUTOWEB COMMERCE SAS",
  legalForm: "Société par actions simplifiée (SAS)",
  shareCapital: "1 000 €",
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
  // Stored in E.164 so the tel: link works from abroad and from a mobile
  // keypad; displayed in the national form every French customer reads
  // without translating it. See formatPhone() / phoneHref() below.
  phone: "+33 7 83 80 96 94",
  publicationDirector: "Nasim Alsawalma, Président",
  host: {
    name: "Vercel Inc.",
    address: "440 N Barranca Ave #4133, Covina, CA 91723, États-Unis", // verify on vercel.com/legal
    website: "https://vercel.com",
  },
  // L612-1: membership of a consumer mediation scheme is compulsory for a
  // trader selling to consumers, and the mediator's name, address and
  // website have to be on the CGV and the mentions légales.
  mediator: {
    name: "CM2C, Centre de la Médiation de la Consommation de Conciliateurs de Justice",
    address: "49 rue de Ponthieu, 75008 Paris",
    website: "https://www.cm2c.net",
  },
  vat: { applicable: true, standardRate: 0.2 },

  // Delivery timing, in business days, per mode. These are inputs to
  // lib/delivery.ts, which turns them into the promise shown on the
  // product page, at checkout and in the confirmation email. They are
  // not display strings: a single "3 à 5 jours" sentence copied across
  // three surfaces is how a site ends up promising one thing on the
  // product page and another in the email.
  delivery: {
    /** Picking, checking and packing, before the carrier has it. */
    preparationBusinessDays: [1, 3] as [number, number],
    pickup: {
      /** From order to "ready at the warehouse", by appointment. */
      readyWithinBusinessDays: 2,
      /** CGV art. 7: how long the buyer has to book a collection slot. */
      bookingWindowDays: 15,
    },
    mondialRelay: {
      /** Carrier transit only; preparation is added on top. */
      transitBusinessDays: [3, 6] as [number, number],
    },
    cocolis: {
      // Cocolis is a carpooling marketplace, not a scheduled carrier:
      // the date is agreed between the buyer and the driver, so the
      // honest promise is a range plus how the date is actually set.
      label: "date convenue avec vous par Cocolis",
      typicalDays: [7, 15] as [number, number],
    },
    /** L216-1: without an agreed date, 30 days is the statutory ceiling. */
    legalMaxDays: 30,
  },

  cgvVersionDate: resolveCgvVersionDate(),
} as const

/** The env var the CGV version date comes from, for the build gate. */
export const CGV_VERSION_DATE_ENV_VAR = CGV_VERSION_DATE_ENV

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

/** "07 83 80 96 94" — the national form, in pairs, as it is read aloud. */
export function formatPhone(): string {
  const digits = COMPANY.phone.replace(/\D/g, '') // 33783809694
  const national = digits.startsWith('33') ? `0${digits.slice(2)}` : digits
  return national.replace(/(\d{2})(?=\d)/g, '$1 ').trim()
}

/** "tel:+33783809694" — E.164, so it dials from anywhere. */
export function phoneHref(): string {
  return `tel:${COMPANY.phone.replace(/[^\d+]/g, '')}`
}

/** The TVA rate as shown in copy: "20 %". */
export const VAT_RATE_LABEL = `${Math.round(COMPANY.vat.standardRate * 100)} %`

/** Sitewide price/payment reassurance line. Task 2 replaced the 293 B one. */
export const PRICE_NOTICE = `Prix TTC, TVA ${VAT_RATE_LABEL} incluse · Paiement sécurisé Stripe`

/** Non-affiliation notice, required wherever the vidaXL name is used. */
export const VIDAXL_DISCLAIMER =
  "Souqify n’est pas affilié à vidaXL. Les marques citées appartiennent à leurs propriétaires."

/**
 * Amazon Associates tracking id. The single source of truth: nothing else
 * in the codebase or in an MDX guide should hardcode a tag= value, since a
 * stale one would misattribute commission on every link that carries it.
 */
export const AMAZON_ASSOCIATE_TAG = "souqify-21"
