import { Resend } from 'resend'
import { BRAND_NAME } from '@/lib/brand'
import { COMPANY, PRICE_NOTICE, formatHeadOffice, isPlaceholder } from '@/lib/company'
import { computeVat, formatAmount } from '@/lib/vat'
import { SHIPPING_LABELS, type ShippingMethod } from '@/lib/shipping'
import { formatDeliveryDate } from '@/lib/delivery'

// Lazily constructed — importing this module must not throw in
// environments (build, tests) where RESEND_API_KEY isn't set yet.
let client: Resend | null = null
function getClient() {
  if (!client) client = new Resend(process.env.RESEND_API_KEY)
  return client
}

const FROM = process.env.EMAIL_FROM || 'verification@souqify.fr'

// Prefers the explicit env var (this is what local dev sets to
// localhost). If that's ever missing on an actual Vercel deployment,
// fall back on Vercel's own auto-set VERCEL_ENV rather than landing on
// the localhost default below — a verification link that only works on
// someone's laptop is worse than one that's merely unconfigured.
function siteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')
  }
  if (process.env.VERCEL_ENV === 'production') return 'https://www.souqify.fr'
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return 'http://localhost:3000'
}

export async function sendVerificationEmail(email: string, token: string) {
  // A path segment, not `?token=` — the token is 64 lowercase hex chars,
  // so a query string always puts "=" directly before two more hex
  // digits, e.g. "=67". Somewhere in the send/receive pipeline that gets
  // misread as the quoted-printable escape for byte 0x67 ('g'), silently
  // eating the "=" and corrupting the token on every single send —
  // confirmed by comparing a real received email against its DB token.
  const link = `${siteUrl()}/verify-email/${token}`

  // The SDK never rejects on API-level failures (bad/unverified domain,
  // rate limits, etc.) — it always resolves to `{ data, error }`. Callers
  // rely on this throwing so their try/catch actually notices a failed
  // send instead of silently reporting success.
  const { error } = await getClient().emails.send({
    from: `${BRAND_NAME} <${FROM}>`,
    to: email,
    subject: 'Confirmez votre adresse email',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #111;">
        <h1 style="font-size: 20px;">Confirmez votre adresse email</h1>
        <p>Cliquez sur le lien ci-dessous pour confirmer votre compte ${BRAND_NAME}. Ce lien expire dans 24 heures.</p>
        <p style="margin: 24px 0;">
          <a href="${link}" style="background: #1d4ed8; color: #fff; padding: 12px 24px; border-radius: 999px; text-decoration: none; font-weight: 600;">
            Confirmer mon email
          </a>
        </p>
        <p style="color: #666; font-size: 13px;">Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br />${link}</p>
        <p style="color: #666; font-size: 13px;">Si vous n'êtes pas à l'origine de cette inscription, ignorez cet email.</p>
      </div>
    `,
  })
  if (error) throw new Error(`Resend: ${error.name} — ${error.message}`)
}

interface ArrivalTarget {
  email: string
  unsubscribeToken: string
}

// Resend's batch endpoint caps out at 100 emails per call.
const BATCH_SIZE = 100

export async function sendNewArrivalNotifications(
  targets: ArrivalTarget[],
  info: { dateLabel: string | null; categoryLabel?: string }
) {
  let sent = 0
  const errors: string[] = []

  for (let i = 0; i < targets.length; i += BATCH_SIZE) {
    const chunk = targets.slice(i, i + BATCH_SIZE)
    const payload = chunk.map((t) => {
      // Path segment, not a query string — see sendVerificationEmail for
      // why (quoted-printable corruption of hex tokens after `=`).
      const unsubscribeLink = `${siteUrl()}/unsubscribe/${t.unsubscribeToken}`
      return {
        from: `${BRAND_NAME} <${FROM}>`,
        to: t.email,
        subject: info.categoryLabel
          ? `Nouveautés ${info.categoryLabel} chez ${BRAND_NAME}`
          : `Nouveautés chez ${BRAND_NAME}`,
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #111;">
            <h1 style="font-size: 20px;">Nouveautés${info.categoryLabel ? ` — ${info.categoryLabel}` : ''}</h1>
            <p>${info.dateLabel ? `De nouveaux produits sont arrivés le ${info.dateLabel}. ` : 'De nouveaux produits viennent d’entrer en stock. '}Chaque pièce est en un seul exemplaire, à voir avant qu’elle ne trouve preneur.</p>
            <p style="margin: 24px 0;">
              <a href="${siteUrl()}${info.categoryLabel ? `/?category=${encodeURIComponent(info.categoryLabel)}` : ''}" style="background: #1d4ed8; color: #fff; padding: 12px 24px; border-radius: 999px; text-decoration: none; font-weight: 600;">
                Voir les nouveautés
              </a>
            </p>
            <p style="color: #999; font-size: 12px;"><a href="${unsubscribeLink}" style="color: #999;">Se désinscrire de ces alertes</a></p>
          </div>
        `,
      }
    })

    const { error } = await getClient().batch.send(payload)
    if (error) {
      errors.push(`${error.name}: ${error.message}`)
      continue
    }
    sent += chunk.length
  }

  return { sent, errors }
}

// ---------------------------------------------------------------------
// Order confirmation
// ---------------------------------------------------------------------

export interface OrderForEmail {
  orderId: string
  createdAt: Date | string
  items: {
    name: string
    price: number
    quantity: number
    /** The return-cost sentence pinned on the order at checkout. */
    returnNote?: string
  }[]
  shippingMethod: ShippingMethod
  shippingCost: number
  shippingDetails?: {
    line1?: string
    line2?: string
    postalCode?: string
    city?: string
    country?: string
  } | null
  customerEmail: string
  customerName?: string
  /** The CGV version the buyer accepted, pinned at checkout. */
  cgvVersionDate?: string
  /** The delivery promise as made in the cart, pinned at checkout. */
  deliveryPromise?: string
  deliveryLatestDate?: Date | string | null
}

function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function formatOrderDate(value: Date | string): string {
  const d = value instanceof Date ? value : new Date(value)
  return d.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })
}

/**
 * The confirmation a buyer gets once Stripe reports the payment as paid.
 *
 * This is NOT an invoice: there is no sequential number and no PDF (see
 * docs/PHASE1_AUDIT.md §12). It is the art. L221-13 written confirmation
 * of the contract, which is why it carries the seller's identity, the
 * TTC/HT/TVA split, the delivery terms actually chosen, and the
 * withdrawal rights. Everything in it is derived from the stored order,
 * never recomputed from the live catalogue, so a price change after the
 * sale cannot rewrite what the customer was told they paid.
 */
export async function sendOrderConfirmation(order: OrderForEmail) {
  const site = siteUrl()

  const itemLines = order.items.map((i) => ({
    label: i.quantity > 1 ? `${i.name} × ${i.quantity}` : i.name,
    ttc: i.price * i.quantity,
    // L221-5 again: the return cost has to reach the buyer, and the
    // confirmation email is the durable copy of it they keep.
    returnNote: i.returnNote || '',
  }))
  const shippingLine =
    order.shippingCost > 0
      ? { label: `Livraison : ${SHIPPING_LABELS[order.shippingMethod]}`, ttc: order.shippingCost }
      : null

  const vat = computeVat([
    ...itemLines.map(({ label, ttc }) => ({ label, ttc })),
    ...(shippingLine ? [shippingLine] : []),
  ])

  const row = (label: string, ttc: number, note = '') => `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #e7e5df;color:#22221f;">
            ${esc(label)}
            ${note ? `<br /><span style="color:#8a887f;font-size:12px;line-height:1.5;">${esc(note)}</span>` : ''}
          </td>
          <td style="padding:10px 0;border-bottom:1px solid #e7e5df;text-align:right;vertical-align:top;white-space:nowrap;color:#22221f;">${formatAmount(ttc)}</td>
        </tr>`

  const itemRows = [
    ...itemLines.map((l) => row(l.label, l.ttc, l.returnNote)),
    ...(shippingLine ? [row(shippingLine.label, shippingLine.ttc)] : []),
  ].join('')

  const isPickup = order.shippingMethod === 'pickup'
  const address = order.shippingDetails

  // Art. L221-13: the confirmation restates the terms actually agreed,
  // which includes the delay. Read from the order, never recomputed:
  // this is what the buyer was shown before paying.
  const latest = order.deliveryLatestDate ? new Date(order.deliveryLatestDate) : null
  const promiseBlock = order.deliveryPromise
    ? `
      <p style="margin:10px 0 0;color:#57564f;line-height:1.6;">
        ${esc(order.deliveryPromise)}${
          latest && !Number.isNaN(latest.getTime())
            ? `<br /><strong style="color:#22221f;">${isPickup ? 'Prêt' : 'Livré'} au plus tard le ${formatDeliveryDate(latest)}.</strong>`
            : ''
        }
      </p>`
    : ''
  const deliveryBlock = isPickup
    ? `
      <p style="margin:0 0 6px;font-weight:600;color:#22221f;">Retrait à l'entrepôt</p>
      <p style="margin:0;color:#57564f;line-height:1.6;">
        ${esc(COMPANY.pickup.label)}<br />
        ${esc(formatHeadOffice())}<br />
        ${esc(COMPANY.pickup.hours)}
      </p>
      ${promiseBlock}
      <p style="margin:10px 0 0;color:#57564f;line-height:1.6;">
        Écrivez-nous à <a href="mailto:${COMPANY.email}" style="color:#3f6b54;">${COMPANY.email}</a>
        pour convenir d'un créneau. Pensez au coffre ou à la remorque pour les pièces volumineuses.
      </p>`
    : `
      <p style="margin:0 0 6px;font-weight:600;color:#22221f;">${esc(SHIPPING_LABELS[order.shippingMethod])}</p>
      <p style="margin:0;color:#57564f;line-height:1.6;">
        ${address?.line1 ? esc(address.line1) + '<br />' : ''}
        ${address?.line2 ? esc(address.line2) + '<br />' : ''}
        ${esc([address?.postalCode, address?.city].filter(Boolean).join(' '))}
      </p>
      ${promiseBlock}
      <p style="margin:10px 0 0;color:#57564f;line-height:1.6;">
        Vous recevrez le numéro de suivi par email dès la prise en charge par le transporteur.
      </p>`

  // Only state a version when there is a real one. A confirmation that
  // cites "[À COMPLÉTER]" as the CGV in force is worse than one that
  // simply links the page.
  const cgvLine =
    order.cgvVersionDate && !isPlaceholder(order.cgvVersionDate)
      ? `Conditions générales de vente en vigueur au ${esc(order.cgvVersionDate)} :
         <a href="${site}/cgv" style="color:#3f6b54;">les consulter</a>.`
      : `<a href="${site}/cgv" style="color:#3f6b54;">Conditions générales de vente</a>.`

  const html = `
  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#22221f;">
    <p style="margin:0 0 4px;font-size:22px;font-weight:600;">${BRAND_NAME}</p>
    <h1 style="margin:0 0 4px;font-size:20px;font-weight:600;">Votre commande est confirmée</h1>
    <p style="margin:0 0 24px;color:#57564f;">
      Merci${order.customerName ? ` ${esc(order.customerName.split(' ')[0])}` : ''}, votre paiement a bien été reçu.
    </p>

    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      <tr>
        <td style="padding:0 0 4px;color:#57564f;">Commande nº</td>
        <td style="padding:0 0 4px;text-align:right;font-weight:600;">${esc(order.orderId)}</td>
      </tr>
      <tr>
        <td style="padding:0 0 16px;color:#57564f;">Date</td>
        <td style="padding:0 0 16px;text-align:right;">${formatOrderDate(order.createdAt)}</td>
      </tr>
    </table>

    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      <thead>
        <tr>
          <th style="padding:0 0 8px;text-align:left;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;color:#8a887f;font-weight:600;">Détail</th>
          <th style="padding:0 0 8px;text-align:right;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;color:#8a887f;font-weight:600;">Montant TTC</th>
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
      <tfoot>
        <tr>
          <td style="padding:12px 0 2px;color:#57564f;">Total HT</td>
          <td style="padding:12px 0 2px;text-align:right;white-space:nowrap;">${formatAmount(vat.totalHT)}</td>
        </tr>
        <tr>
          <td style="padding:2px 0;color:#57564f;">TVA ${vat.rateLabel}</td>
          <td style="padding:2px 0;text-align:right;white-space:nowrap;">${formatAmount(vat.totalVat)}</td>
        </tr>
        <tr>
          <td style="padding:10px 0 0;border-top:2px solid #22221f;font-weight:600;font-size:16px;">Total TTC</td>
          <td style="padding:10px 0 0;border-top:2px solid #22221f;text-align:right;white-space:nowrap;font-weight:600;font-size:16px;">${formatAmount(vat.totalTTC)}</td>
        </tr>
      </tfoot>
    </table>

    <div style="margin:28px 0 0;padding:16px;background:#f4f3ef;border-radius:8px;font-size:14px;">
      ${deliveryBlock}
    </div>

    <div style="margin:24px 0 0;font-size:13px;color:#57564f;line-height:1.7;">
      <p style="margin:0 0 6px;font-weight:600;color:#22221f;">Droit de rétractation</p>
      <p style="margin:0;">
        Vous disposez de 14 jours à compter de la réception de votre commande, retrait à l'entrepôt
        compris, pour vous rétracter sans avoir à vous justifier. Les frais de renvoi sont à votre
        charge. Le formulaire et la marche à suivre sont sur
        <a href="${site}/retractation" style="color:#3f6b54;">la page Rétractation</a>.
      </p>
      <p style="margin:10px 0 0;">${cgvLine}</p>
    </div>

    <div style="margin:28px 0 0;padding-top:16px;border-top:1px solid #e7e5df;font-size:12px;color:#8a887f;line-height:1.7;">
      <p style="margin:0;">
        ${esc(COMPANY.tradeName)}, marque exploitée par ${esc(COMPANY.legalName)}<br />
        ${esc(COMPANY.legalForm)}, ${esc(COMPANY.rcs)}<br />
        SIREN ${esc(COMPANY.siren)} · TVA intracommunautaire ${esc(COMPANY.vatNumber)}<br />
        Siège social : ${esc(formatHeadOffice({ withCountry: true }))}<br />
        <a href="mailto:${COMPANY.email}" style="color:#8a887f;">${COMPANY.email}</a>
      </p>
      <p style="margin:10px 0 0;">${PRICE_NOTICE}</p>
    </div>
  </div>`

  const { error } = await getClient().emails.send({
    from: `${BRAND_NAME} <${FROM}>`,
    to: order.customerEmail,
    subject: `Commande ${order.orderId} confirmée`,
    html,
  })
  if (error) throw new Error(`Resend: ${error.name} — ${error.message}`)
}
