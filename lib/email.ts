import { Resend } from 'resend'
import { BRAND_NAME } from '@/lib/brand'

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
