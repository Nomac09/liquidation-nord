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
      errors: [] as string[],
      uploadedUrls: [] as string[]
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

        // For now, create a data URL from the file
        const buffer = Buffer.from(await file.arrayBuffer())
        const base64 = buffer.toString('base64')
        const dataUrl = `data:${file.type};base64,${base64}`
        
        // Add to product's photos array
        await Product.updateOne(
          { ean },
          { 
            $push: { photos: dataUrl },
            $set: { updatedAt: new Date() }
          }
        )
        
        results.matched++
        results.uploadedUrls.push(dataUrl.substring(0, 50) + '...') // For debugging
        
      } catch (error: any) {
        results.errors.push(`Error processing ${file.name}: ${error.message}`)
      }
    }

    return NextResponse.json({
      success: true,
      matched: results.matched,
      total: results.total,
      errors: results.errors,
      debug: {
        uploadedCount: results.uploadedUrls.length,
        sampleUrls: results.uploadedUrls.slice(0, 3)
      }
    })
  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Bulk upload failed', 
      details: error.message 
    }, { status: 500 })
  }
}
