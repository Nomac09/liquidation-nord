import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Product from '@/lib/schemas/Product'
import { utapi } from 'uploadthing/server'

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

    // Upload all images to UploadThing
    const uploadPromises = files.map(async (file) => {
      try {
        const uploadResult = await utapi.uploadFiles(file)
        if (uploadResult.error) {
          throw new Error(uploadResult.error.message)
        }
        return {
          originalName: file.name,
          url: uploadResult.data.url,
          key: uploadResult.data.key
        }
      } catch (error) {
        results.errors.push(`Failed to upload ${file.name}: ${error}`)
        return null
      }
    })

    const uploadedImages = await Promise.all(uploadPromises)
    const validImages = uploadedImages.filter(img => img !== null)

    // Match images to products by EAN
    for (const image of validImages) {
      try {
        // Extract EAN from filename (e.g., "8718475600800_m.jpg" → "8718475600800")
        const filename = image.originalName
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
            $push: { photos: image.url },
            $set: { updatedAt: new Date() }
          }
        )
        
        results.matched++
      } catch (error) {
        results.errors.push(`Error processing ${image.originalName}: ${error}`)
      }
    }

    return NextResponse.json({
      success: true,
      matched: results.matched,
      total: results.total,
      errors: results.errors
    })
  } catch (error) {
    return NextResponse.json({ 
      error: 'Bulk upload failed', 
      details: error.message 
    }, { status: 500 })
  }
}
