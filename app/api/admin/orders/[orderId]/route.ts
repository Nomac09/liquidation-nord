import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/adminAuth'
import connectDB from '@/lib/mongodb'
import Order from '@/lib/schemas/Order'
import { deliveryStatusOptions, type DeliveryStatus } from '@/lib/orderStatus'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const denied = requireAdmin(request)
  if (denied) return denied

  const { orderId } = await params
  const body = await request.json().catch(() => ({}))

  await connectDB()
  const order = await Order.findOne({ orderId })
  if (!order) {
    return NextResponse.json({ error: 'not-found' }, { status: 404 })
  }

  if (typeof body?.deliveryStatus === 'string') {
    const valid = deliveryStatusOptions(order.shippingMethod)
    if (!valid.includes(body.deliveryStatus as DeliveryStatus)) {
      return NextResponse.json({ error: 'invalid-status-for-shipping-method' }, { status: 400 })
    }
    order.deliveryStatus = body.deliveryStatus
  }
  if (typeof body?.trackingNumber === 'string') {
    order.trackingNumber = body.trackingNumber.trim().slice(0, 100)
  }

  await order.save()
  return NextResponse.json({ ok: true })
}
