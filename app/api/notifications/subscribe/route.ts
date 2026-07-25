import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { auth } from '@/auth'
import connectDB from '@/lib/mongodb'
import NotificationSubscriber from '@/lib/schemas/NotificationSubscriber'
import { CATEGORY_ORDER } from '@/lib/categories'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// No account required — a visitor who wants a heads-up on the next drop
// shouldn't have to register first. If they happen to be signed in, the
// subscription is tagged with their account for reference only.
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const email = String(body?.email || '').toLowerCase().trim()
  const rawCategories = Array.isArray(body?.categories) ? body.categories : []
  const categories = rawCategories.filter(
    (c: unknown): c is string => typeof c === 'string' && (CATEGORY_ORDER as readonly string[]).includes(c)
  )

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'invalid-email' }, { status: 400 })
  }

  const session = await auth()
  await connectDB()

  await NotificationSubscriber.findOneAndUpdate(
    { email },
    {
      $set: {
        categories,
        ...(session?.user?.id ? { userId: session.user.id } : {}),
      },
      $setOnInsert: {
        unsubscribeToken: crypto.randomBytes(32).toString('hex'),
        createdAt: new Date(),
      },
    },
    { upsert: true }
  )

  return NextResponse.json({ ok: true })
}
