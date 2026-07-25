import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/adminAuth'
import connectDB from '@/lib/mongodb'
import Order from '@/lib/schemas/Order'

export async function GET(request: NextRequest) {
  const denied = requireAdmin(request)
  if (denied) return denied

  await connectDB()
  const orders = await Order.find()
    .select('orderId customerEmail customerName total paymentStatus deliveryStatus shippingMethod trackingNumber createdAt items')
    .sort({ createdAt: -1 })
    .limit(200)
    .lean()

  return NextResponse.json(orders)
}
