import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Product from '@/lib/schemas/Product'

// Handle POST requests for processing uploaded images
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const { files } = await request.json()
    
    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 })
    }

    const results = {
      matched: 0,
      total: files.length,
      errors: [] as string[]
    }

    // Process each uploaded file - NOW WITH REAL URLs!
    for (const file of files) {
      try {
        const filename = file.name
        const fileUrl = file.url // This is the REAL UploadThing URL!
        
        // Extract EAN from filename
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

        // Add the REAL UploadThing URL to product's photos array
        await Product.updateOne(
          { ean },
          { 
            $push: { photos: fileUrl }, // Use the real URL!
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
      error: 'Processing failed', 
      details: errorMessage 
    }, { status: 500 })
  }
}

// Keep the existing GET handler for backwards compatibility
export async function GET() {
  return new Response("Admin API - Use POST to process images")
}
