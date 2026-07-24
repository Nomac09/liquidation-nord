import { NextRequest, NextResponse } from 'next/server'
import mongoose from 'mongoose'
import { auth } from '@/auth'
import connectDB from '@/lib/mongodb'
import Product from '@/lib/schemas/Product'
import Order from '@/lib/schemas/Order'
import User from '@/lib/schemas/User'
import { stripe } from '@/lib/stripe'

const SHIPPING = {
  pickup: { label: 'Retrait à Bondues', cost: 0 },
  relay: { label: 'Point relais', cost: 29.99 },
  home: { label: 'À domicile', cost: 79.99 },
} as const

type ShippingMethod = keyof typeof SHIPPING

function isShippingMethod(value: unknown): value is ShippingMethod {
  return typeof value === 'string' && value in SHIPPING
}

function generateOrderId() {
  const stamp = Date.now().toString(36).toUpperCase()
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `SQ-${stamp}-${rand}`
}

// Creates the Stripe Checkout Session that actually takes payment. This is
// a UX pre-check only — it stops a customer from paying for something
// that's visibly already gone. It is NOT what makes "first payment wins"
// safe: that guarantee comes from the atomic conditional update in the
// webhook handler, which is the only place a product is ever marked sold.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const rawIds: string[] = Array.isArray(body?.items)
      ? body.items.map((i: { productId?: string }) => i?.productId).filter(Boolean)
      : []
    const shippingMethod: ShippingMethod = isShippingMethod(body?.shippingMethod)
      ? body.shippingMethod
      : 'pickup'

    const customerName = String(body?.customer?.name || '').trim().slice(0, 120)
    const customerPhone = String(body?.customer?.phone || '').trim().slice(0, 30)
    const rawAddress = body?.customer?.address || {}
    const address = {
      line1: String(rawAddress.line1 || '').trim().slice(0, 200),
      line2: String(rawAddress.line2 || '').trim().slice(0, 200),
      postalCode: String(rawAddress.postalCode || '').trim().slice(0, 12),
      city: String(rawAddress.city || '').trim().slice(0, 100),
      country: String(rawAddress.country || 'France').trim().slice(0, 60),
    }

    if (rawIds.length === 0) {
      return NextResponse.json({ error: 'empty-cart' }, { status: 400 })
    }
    if (!customerName || !customerPhone || !address.line1 || !address.postalCode || !address.city) {
      return NextResponse.json({ error: 'missing-customer-details' }, { status: 400 })
    }

    const requestedIds = Array.from(new Set(rawIds)).filter((id) => mongoose.Types.ObjectId.isValid(id))
    if (requestedIds.length !== rawIds.length) {
      // Malformed id in the cart — treat it the same as "gone".
      return NextResponse.json({
        error: 'unavailable',
        items: rawIds
          .filter((id) => !mongoose.Types.ObjectId.isValid(id))
          .map((id) => ({ productId: id, name: 'Cette pièce' })),
      }, { status: 409 })
    }

    await connectDB()

    // If signed in, keep the account's saved details in sync with whatever
    // was just submitted at checkout — this is what "tied to account"
    // means in practice: next checkout, it's already prefilled.
    const authSession = await auth()
    let accountEmail: string | undefined
    let accountUserId: string | undefined
    if (authSession?.user?.id) {
      accountUserId = authSession.user.id
      const user = await User.findByIdAndUpdate(
        accountUserId,
        { $set: { name: customerName, phone: customerPhone, address } },
        { new: true }
      ).select('email')
      accountEmail = user?.email
    }

    const products = await Product.find({ _id: { $in: requestedIds } })
      .select('name salePrice photos status')
      .lean()
    const byId = new Map(products.map((p) => [String(p._id), p]))

    const unavailable = requestedIds
      .filter((id) => byId.get(id)?.status !== 'sellable')
      .map((id) => ({ productId: id, name: byId.get(id)?.name || 'Cette pièce' }))

    if (unavailable.length > 0) {
      return NextResponse.json({ error: 'unavailable', items: unavailable }, { status: 409 })
    }

    const items = requestedIds.map((id) => {
      const p = byId.get(id)!
      return {
        productId: id,
        name: p.name as string,
        price: p.salePrice as number,
        quantity: 1,
        photo: (p.photos as string[] | undefined)?.[0] || '',
      }
    })

    const subtotal = items.reduce((sum, i) => sum + i.price, 0)
    const shippingCost = SHIPPING[shippingMethod].cost
    const total = subtotal + shippingCost
    const orderId = generateOrderId()
    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '')

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        ...items.map((i) => ({
          quantity: 1,
          price_data: {
            currency: 'eur',
            unit_amount: Math.round(i.price * 100),
            product_data: {
              name: i.name,
              images: i.photo.startsWith('http') ? [i.photo] : undefined,
            },
          },
        })),
        ...(shippingCost > 0
          ? [{
              quantity: 1,
              price_data: {
                currency: 'eur',
                unit_amount: Math.round(shippingCost * 100),
                product_data: { name: `Livraison — ${SHIPPING[shippingMethod].label}` },
              },
            }]
          : []),
      ],
      success_url: `${siteUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/cart`,
      customer_email: accountEmail,
      metadata: { orderId },
    })

    await Order.create({
      orderId,
      items,
      subtotal,
      shippingMethod,
      shippingCost,
      shippingDetails: address,
      total,
      stripeSessionId: session.id,
      paymentStatus: 'pending',
      customerName,
      customerPhone,
      userId: accountUserId,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('checkout session creation failed', error)
    return NextResponse.json({ error: 'Payment service unavailable' }, { status: 503 })
  }
}
