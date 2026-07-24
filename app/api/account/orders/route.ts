import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import connectDB from '@/lib/mongodb'
import Order from '@/lib/schemas/Order'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  await connectDB()
  const orders = await Order.find({ userId: session.user.id })
    .select('orderId items total paymentStatus deliveryStatus createdAt')
    .sort({ createdAt: -1 })
    .limit(50)
    .lean()

  return NextResponse.json(orders)
}
