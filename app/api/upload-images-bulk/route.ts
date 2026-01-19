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

    // Simple file upload approach using your existing uploadthing setup
    for (const file of files) {
      try {
        // Create form data for single file
        const singleFormData = new FormData()
        singleFormData.append('file', file)
        
        // Upload to your existing uploadthing endpoint
        const uploadResponse = await fetch('/api/uploadthing', {
          method: 'POST',
          body: singleFormData
        })

        if (!uploadResponse.ok) {
          throw new Error(`Upload failed: ${uploadResponse.status}`)
        }

        const uploadData = await uploadResponse.json()
        
        if (uploadData.url) {
          // Extract EAN from filename (e.g., "8718475600800_m.jpg" → "8718475600800")
          const filename = file.name
          const eanMatch = filename.match(/^(\d{13})/)
          
          if (!eanMatch) {
            results.errors.push(`No valid EAN found in filename: ${filename}`)
            continue
          }

          const ean = eanMatch[1]
          
          // Find product and add image URL
          const product = await Product.findOne({ ean })
          
          if (!product) {
            results.errors.push(`No product found with EAN: ${ean}`)
            continue
          }

          // Add image to product's photos array
          await Product.updateOne(
            { ean },
            { 
              $push: { photos: uploadData.url },
              $set: { updatedAt: new Date() }
            }
          )
          
          results.matched++
        } else {
          results.errors.push(`No URL returned for ${file.name}`)
        }
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
