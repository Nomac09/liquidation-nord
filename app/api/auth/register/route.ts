import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import connectDB from '@/lib/mongodb'
import User from '@/lib/schemas/User'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const email = String(body?.email || '').toLowerCase().trim()
    const password = String(body?.password || '')
    const name = String(body?.name || '').trim()

    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: 'invalid-email' }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'weak-password' }, { status: 400 })
    }
    if (!name) {
      return NextResponse.json({ error: 'missing-name' }, { status: 400 })
    }

    await connectDB()

    const existing = await User.findOne({ email })
    if (existing) {
      return NextResponse.json({ error: 'email-taken' }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(password, 12)
    await User.create({ email, name, passwordHash })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('registration failed', error)
    return NextResponse.json({ error: 'server-error' }, { status: 500 })
  }
}
