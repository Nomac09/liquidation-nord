import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Product from '@/lib/schemas/Product'

export async function GET() {
  try {
    await connectDB()
    
    // Check total products and how many have photos
    const totalProducts = await Product.countDocuments()
    const productsWithPhotos = await Product.countDocuments({ 
      photos: { $exists: true, $ne: [] } 
    })
    
    // Get a few sample products
    const sampleProducts = await Product.find().limit(3)
    
    return NextResponse.json({
      totalProducts,
      productsWithPhotos,
      sampleProducts: sampleProducts.map(p => ({
        name: p.name,
        ean: p.ean,
        photosCount: p.photos?.length || 0,
        firstPhoto: p.photos?.[0]
      }))
    })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
