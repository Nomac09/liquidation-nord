import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { auth } from '@/auth'
import connectDB from '@/lib/mongodb'
import User from '@/lib/schemas/User'
import { sendVerificationEmail } from '@/lib/email'

const COOLDOWN_MS = 60 * 1000

export async function POST() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  await connectDB()
  const user = await User.findById(session.user.id).select('email emailVerified verificationSentAt')
  if (!user) {
    return NextResponse.json({ error: 'not-found' }, { status: 404 })
  }
  if (user.emailVerified) {
    return NextResponse.json({ error: 'already-verified' }, { status: 400 })
  }
  if (user.verificationSentAt && Date.now() - user.verificationSentAt.getTime() < COOLDOWN_MS) {
    return NextResponse.json({ error: 'rate-limited' }, { status: 429 })
  }

  const verificationToken = crypto.randomBytes(32).toString('hex')
  user.verificationToken = verificationToken
  user.verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000)
  user.verificationSentAt = new Date()
  await user.save()

  try {
    await sendVerificationEmail(user.email, verificationToken)
  } catch (error) {
    console.error('verification email failed to send', error)
    return NextResponse.json({ error: 'send-failed' }, { status: 502 })
  }

  return NextResponse.json({ ok: true })
}
