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

function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '')
}

export async function sendVerificationEmail(email: string, token: string) {
  const link = `${siteUrl()}/verify-email?token=${token}`

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
