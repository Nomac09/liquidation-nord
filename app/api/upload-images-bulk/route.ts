import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Product from '@/lib/schemas/Product'

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const data = await request.formData()
    const files = data.getAll('images') as File[]
    
    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No images provided' }, { status: 400 })
    }

    const results = {
      matched: 0,
      total: files.length,
      errors: [] as string[]
    }

    // Process each file in the batch
    for (const file of files) {
      try {
        // Extract EAN from filename
        const filename = file.name
        const eanMatch = filename.match(/^(\d{13})/)
        
        if (!eanMatch) {
          results.errors.push(`No valid EAN found in filename: ${filename}`)
          continue
        }

        const ean = eanMatch[1]
        
        // Find product 
        const product = await Product.findOne({ ean })
        
        if (!product) {
          results.errors.push(`No product found with EAN: ${ean}`)
          continue
        }

        // For now, let's use a temporary placeholder that actually works
        // Later we'll integrate with UploadThing properly
        const tempImageUrl = `https://via.placeholder.com/400x300.png?text=${ean}`
        
        // Add to product's photos array
        await Product.updateOne(
          { ean },
          { 
            $push: { photos: tempImageUrl },
            $set: { updatedAt: new Date() }
          }
        )
        
        results.matched++
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        results.errors.push(`Error processing ${file.name}: ${errorMessage}`)
      }
    }

    return NextResponse.json({
      success: true,
      matched: results.matched,
      total: results.total,
      errors: results.errors
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ 
      error: 'Bulk upload failed', 
      details: errorMessage 
    }, { status: 500 })
  }
}
