import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import connectDB from '@/lib/mongodb'
import User from '@/lib/schemas/User'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  await connectDB()
  const user = await User.findById(session.user.id).select('email name phone address').lean()
  if (!user) return NextResponse.json({ error: 'not-found' }, { status: 404 })
  return NextResponse.json(user)
}

export async function PATCH(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const name = typeof body?.name === 'string' ? body.name.trim().slice(0, 120) : undefined
  const phone = typeof body?.phone === 'string' ? body.phone.trim().slice(0, 30) : undefined
  const addr = body?.address || {}
  const address = {
    line1: typeof addr.line1 === 'string' ? addr.line1.trim().slice(0, 200) : '',
    line2: typeof addr.line2 === 'string' ? addr.line2.trim().slice(0, 200) : '',
    postalCode: typeof addr.postalCode === 'string' ? addr.postalCode.trim().slice(0, 12) : '',
    city: typeof addr.city === 'string' ? addr.city.trim().slice(0, 100) : '',
    country: typeof addr.country === 'string' && addr.country.trim() ? addr.country.trim().slice(0, 60) : 'France',
  }

  await connectDB()
  const update: Record<string, unknown> = { address }
  if (name !== undefined) update.name = name
  if (phone !== undefined) update.phone = phone

  const user = await User.findByIdAndUpdate(session.user.id, { $set: update }, { new: true })
    .select('email name phone address')
    .lean()

  return NextResponse.json(user)
}
