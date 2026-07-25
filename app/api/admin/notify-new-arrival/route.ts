import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/adminAuth'
import connectDB from '@/lib/mongodb'
import NotificationSubscriber from '@/lib/schemas/NotificationSubscriber'
import { getDropInfo } from '@/lib/drop'
import { sendNewArrivalNotifications } from '@/lib/email'
import { CATEGORY_LABELS } from '@/lib/categories'

export async function POST(request: NextRequest) {
  const denied = requireAdmin(request)
  if (denied) return denied

  const body = await request.json().catch(() => ({}))
  const category = typeof body?.category === 'string' && CATEGORY_LABELS[body.category] ? body.category : undefined

  await connectDB()
  // A subscriber with no category preference (empty array) opted into
  // everything, so they're included in every send regardless of scope.
  const query = category ? { $or: [{ categories: category }, { categories: { $size: 0 } }] } : {}
  const subscribers = await NotificationSubscriber.find(query).select('email unsubscribeToken').lean()

  if (subscribers.length === 0) {
    return NextResponse.json({ sent: 0, total: 0, errors: [] })
  }

  const drop = await getDropInfo()
  const { sent, errors } = await sendNewArrivalNotifications(
    subscribers.map((s) => ({ email: s.email, unsubscribeToken: s.unsubscribeToken })),
    { dateLabel: drop.dateLabel, categoryLabel: category ? CATEGORY_LABELS[category] : undefined }
  )

  return NextResponse.json({ sent, total: subscribers.length, errors })
}
