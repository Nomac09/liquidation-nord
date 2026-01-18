// app/api/admin/stats/route.ts
import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Product from '@/lib/schemas/Product'
import Order from '@/lib/schemas/Order'

export async function GET() {
  try {
    await connectDB()

    const [
      totalProducts,
      totalOrders,
      totalRevenue,
      soldCount,
      topCategories
    ] = await Promise.all([
      Product.countDocuments({ status: 'sellable' }),
      Order.countDocuments(),
      Order.aggregate([
        { $match: { paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]),
      Product.countDocuments({ status: 'sold' }),
      Product.aggregate([
        { $match: { status: 'sellable' } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ])
    ])

    return NextResponse.json({
      totalProducts,
      totalOrders,
      totalRevenue: totalRevenue[0]?.total || 0,
      soldCount,
      topCategories
    })
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}