import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Product from '@/lib/schemas/Product'

export async function POST(request: NextRequest) {
  console.log('=== BULK IMAGE UPLOAD STARTED ===')
  
  try {
    console.log('Connecting to DB...')
    await connectDB()
    console.log('DB connected successfully')
    
    console.log('Parsing form data...')
    const data = await request.formData()
    const files = data.getAll('images') as File[]
    console.log(`Found ${files.length} files`)
    
    if (!files || files.length === 0) {
      console.log('No files provided')
      return NextResponse.json({ error: 'No images provided' }, { status: 400 })
    }

    const results = {
      matched: 0,
      total: files.length,
      errors: [] as string[]
    }

    console.log('Processing files one by one...')
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      console.log(`Processing file ${i + 1}/${files.length}: ${file.name}`)
      
      try {
        // Extract EAN from filename
        const filename = file.name
        console.log(`Extracting EAN from: ${filename}`)
        
        const eanMatch = filename.match(/^(\d{13})/)
        console.log(`EAN match result:`, eanMatch)
        
        if (!eanMatch) {
          const error = `No valid EAN found in filename: ${filename}`
          console.log(error)
          results.errors.push(error)
          continue
        }

        const ean = eanMatch[1]
        console.log(`Found EAN: ${ean}`)
        
        // Find product 
        console.log(`Looking for product with EAN: ${ean}`)
        const product = await Product.findOne({ ean })
        console.log(`Product found:`, product ? 'YES' : 'NO')
        
        if (!product) {
          const error = `No product found with EAN: ${ean}`
          console.log(error)
          results.errors.push(error)
          continue
        }

        // Add placeholder image
        const placeholderUrl = `https://via.placeholder.com/400x300?text=Product+${ean}`
        console.log(`Adding placeholder URL: ${placeholderUrl}`)
        
        const updateResult = await Product.updateOne(
          { ean },
          { 
            $push: { photos: placeholderUrl },
            $set: { updatedAt: new Date() }
          }
        )
        
        console.log(`Update result:`, updateResult)
        results.matched++
        console.log(`✅ File ${i + 1} processed successfully`)
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        console.log(`❌ Error processing file ${i + 1}:`, errorMessage)
        results.errors.push(`Error processing ${file.name}: ${errorMessage}`)
      }
    }

    console.log('=== FINAL RESULTS ===', results)
    return NextResponse.json({
      success: true,
      matched: results.matched,
      total: results.total,
      errors: results.errors
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.log('=== MAJOR ERROR ===', errorMessage)
    return NextResponse.json({ 
      error: 'Bulk upload failed', 
      details: errorMessage 
    }, { status: 500 })
  }
}
