import { NextRequest, NextResponse } from 'next/server'
import { createHash, randomBytes } from 'node:crypto'
import connectDB from '@/lib/mongodb'
import AffiliateClick from '@/lib/schemas/AffiliateClick'

// Per-instance salt, regenerated on cold start and never persisted. The
// rate limiter needs to tell callers apart; it does not need to know who
// they are, and an unsalted IP hash is reversible by brute force over the
// whole IPv4 space in seconds.
const SALT = randomBytes(16)

const WINDOW_MS = 60_000
const MAX_PER_WINDOW = 30
const MAX_BUCKETS = 10_000

/**
 * Best-effort in-memory limiter.
 *
 * Vercel Fluid Compute reuses instances but runs several concurrently, so
 * the real ceiling is MAX_PER_WINDOW multiplied by however many instances
 * are warm. That is fine for the threat here, which is a bored script
 * inflating click counts, not a targeted attack: the endpoint writes five
 * scalar fields and holds no secrets. A shared store would be the answer
 * if this ever guarded anything that mattered.
 */
const buckets = new Map<string, { count: number; resetAt: number }>()

function rateLimited(request: NextRequest): boolean {
  const forwarded = request.headers.get('x-forwarded-for') || ''
  const ip = forwarded.split(',')[0].trim() || 'unknown'
  const key = createHash('sha256').update(SALT).update(ip).digest('base64')

  const now = Date.now()
  const bucket = buckets.get(key)

  if (!bucket || now > bucket.resetAt) {
    // Cheap eviction: the map only grows while traffic does, and a full
    // sweep on every request would cost more than the limiter saves.
    if (buckets.size > MAX_BUCKETS) {
      // forEach, not for...of: tsconfig targets es5, where iterating a
      // Map needs downlevelIteration, and this is not the place to
      // change the project's compiler settings.
      buckets.forEach((v, k) => {
        if (now > v.resetAt) buckets.delete(k)
      })
    }
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS })
    return false
  }

  bucket.count += 1
  return bucket.count > MAX_PER_WINDOW
}

const MERCHANTS = new Set(['amazon', 'awin', 'affilae'])

export async function POST(request: NextRequest) {
  if (rateLimited(request)) {
    return NextResponse.json({ error: 'rate-limited' }, { status: 429 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid-json' }, { status: 400 })
  }

  const payload = body as Record<string, unknown>
  const affiliateId = String(payload?.affiliateId || '').trim().slice(0, 100)
  const merchant = String(payload?.merchant || '').trim().slice(0, 40)
  const pageSlug = String(payload?.pageSlug || '').trim().slice(0, 200)
  const position = Number(payload?.position)

  if (!affiliateId || !MERCHANTS.has(merchant)) {
    return NextResponse.json({ error: 'invalid-payload' }, { status: 400 })
  }

  try {
    await connectDB()
    await AffiliateClick.create({
      affiliateId,
      merchant,
      pageSlug,
      position: Number.isFinite(position) ? Math.max(0, Math.trunc(position)) : 0,
      ts: new Date(),
    })
  } catch (error) {
    // Logged, never surfaced. This is fired by sendBeacon as the page
    // unloads on the way to a partner site: the click must not be slowed
    // down or interfered with because a write failed.
    console.error('affiliate click tracking failed', error)
  }

  // 204 regardless, for the same reason.
  return new NextResponse(null, { status: 204 })
}
