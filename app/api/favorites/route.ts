import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import connectDB from '@/lib/mongodb'
import Favorite from '@/lib/schemas/Favorite'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  await connectDB()
  const favorites = await Favorite.find({ userId: session.user.id }).select('productId').lean()
  return NextResponse.json({ productIds: favorites.map((f) => String(f.productId)) })
}
