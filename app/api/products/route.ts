import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Product from '@/lib/schemas/Product'
import { getProducts } from '@/lib/catalog'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const { items, total } = await getProducts({
      category: searchParams.get('category'),
      search: searchParams.get('search'),
      limit: parseInt(searchParams.get('limit') || '24', 10) || 24,
      skip: parseInt(searchParams.get('skip') || '0', 10) || 0,
    })
    return NextResponse.json({ items, total })
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const password = request.headers.get('x-admin-password')
    if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    const body = await request.json()

    const product = new Product(body)
    await product.save()

    return NextResponse.json(product)
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
