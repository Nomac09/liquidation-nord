import { NextRequest, NextResponse } from 'next/server'
import mongoose from 'mongoose'
import { auth } from '@/auth'
import connectDB from '@/lib/mongodb'
import Favorite from '@/lib/schemas/Favorite'
import Product from '@/lib/schemas/Product'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const { productId } = await params
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    return NextResponse.json({ error: 'invalid-product' }, { status: 400 })
  }

  await connectDB()
  const exists = await Product.exists({ _id: productId })
  if (!exists) {
    return NextResponse.json({ error: 'not-found' }, { status: 404 })
  }

  // Upsert rather than create — a duplicate toggle (double-click, retry
  // after a dropped response) must not throw on the unique index.
  await Favorite.findOneAndUpdate(
    { userId: session.user.id, productId },
    { $setOnInsert: { userId: session.user.id, productId, createdAt: new Date() } },
    { upsert: true }
  )

  return NextResponse.json({ ok: true })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const { productId } = await params
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    return NextResponse.json({ error: 'invalid-product' }, { status: 400 })
  }

  await connectDB()
  await Favorite.deleteOne({ userId: session.user.id, productId })

  return NextResponse.json({ ok: true })
}
