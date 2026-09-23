import mongoose from 'mongoose'

/**
 * One outbound click on a partner link.
 *
 * Deliberately holds nothing that identifies a person: no IP, no user
 * agent, no session, no user id, no cookie. That is what lets it run
 * whether or not analytics consent was given, which matters because
 * refusing GA4 would otherwise make affiliate performance invisible, and
 * the honest response to that would be to stop asking for consent rather
 * than to guess.
 *
 * It answers exactly one question: which link, on which page, how often.
 */
const AffiliateClickSchema = new mongoose.Schema(
  {
    affiliateId: { type: String, required: true, index: true },
    merchant: { type: String, required: true },
    pageSlug: { type: String, required: true, index: true },
    position: { type: Number, default: 0 },
    ts: { type: Date, default: Date.now, index: true },
  },
  { collection: 'affiliate_clicks' }
)

export default mongoose.models.AffiliateClick ||
  mongoose.model('AffiliateClick', AffiliateClickSchema)
