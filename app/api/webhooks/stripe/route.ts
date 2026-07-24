import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import connectDB from '@/lib/mongodb'
import Order from '@/lib/schemas/Order'
import Product from '@/lib/schemas/Product'
import { stripe } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  const signature = request.headers.get('stripe-signature')
  const secret = process.env.STRIPE_WEBHOOK_SECRET

  if (!signature || !secret) {
    return NextResponse.json({ error: 'missing signature' }, { status: 400 })
  }

  const rawBody = await request.text()
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, secret)
  } catch (err) {
    console.error('webhook signature verification failed', err)
    return NextResponse.json({ error: 'invalid signature' }, { status: 400 })
  }

  await connectDB()

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      // For delayed payment methods (e.g. SEPA debit), a completed session
      // isn't paid yet — payment_status stays 'unpaid' until
      // async_payment_succeeded fires. Only fulfill immediately-paid ones
      // here; the async event below handles the rest.
      if (session.payment_status === 'paid') {
        await markOrderPaid(session)
      }
      break
    }
    case 'checkout.session.async_payment_succeeded': {
      await markOrderPaid(event.data.object as Stripe.Checkout.Session)
      break
    }
    case 'checkout.session.async_payment_failed': {
      const session = event.data.object as Stripe.Checkout.Session
      await Order.updateOne(
        { stripeSessionId: session.id, paymentStatus: 'pending' },
        { paymentStatus: 'failed' }
      )
      break
    }
    case 'checkout.session.expired': {
      const session = event.data.object as Stripe.Checkout.Session
      await Order.updateOne(
        { stripeSessionId: session.id, paymentStatus: 'pending' },
        { paymentStatus: 'failed' }
      )
      break
    }
  }

  return NextResponse.json({ received: true })
}

// The only place a product is ever marked sold. The status:'sellable'
// guard makes this a single atomic compare-and-swap per item, which is
// what actually enforces "first successful payment wins" — the
// availability check at session-creation time is only a UX nicety.
async function markOrderPaid(session: Stripe.Checkout.Session) {
  const order = await Order.findOne({ stripeSessionId: session.id })
  if (!order) {
    console.error('webhook: no order for session', session.id)
    return
  }
  // Idempotent against event redelivery: once paid, re-running the
  // conditional updates would find products already flipped to 'sold'
  // and wrongly report them as conflicts.
  if (order.paymentStatus === 'paid') return

  const conflicts: string[] = []
  for (const item of order.items) {
    const result = await Product.findOneAndUpdate(
      { _id: item.productId, status: 'sellable' },
      { status: 'sold', soldAt: new Date() }
    )
    if (!result) conflicts.push(item.productId)
  }

  order.paymentStatus = 'paid'
  order.customerEmail = session.customer_details?.email || session.customer_email || ''
  if (conflicts.length > 0) order.soldConflicts = conflicts
  await order.save()
}
