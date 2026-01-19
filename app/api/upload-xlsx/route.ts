import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Product from '@/lib/schemas/Product'
import * as XLSX from 'xlsx'

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const data = await request.formData()
    const file: File | null = data.get('file') as unknown as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const jsonData = XLSX.utils.sheet_to_json(worksheet)

    console.log('Excel data preview:', jsonData.slice(0, 3)) // Log first 3 rows

    const results = {
      imported: 0,
      updated: 0,
      errors: [] as string[],
      debug: [] as string[]
    }

    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i]
      try {
        console.log(`Processing row ${i}:`, row)

        const ean = String((row as any)['EAN'] || '')
        const name = String((row as any)['Name'] || '')
        const category = String((row as any)['Category'] || 'Bazar')
        const rrp = parseFloat(String((row as any)['RRP'] || '0'))
        const quantity = parseInt(String((row as any)['Quantity'] || '1'))

        console.log(`Row ${i} extracted data:`, { ean, name, category, rrp, quantity })

        if (!name || !ean) {
          results.errors.push(`Row ${i+1}: Missing name or EAN - Name: "${name}", EAN: "${ean}"`)
          continue
        }

        const productData = {
          ean,
          sku: String((row as any)['SKU'] || ''),
          name,
          category,
          rrp,
          quantity,
          photos: [] as string[],
          status: 'sellable' as const,
          condition: "Non testé - Retour client",
          dimensions: '',
          weight: 0,
          slug: `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${ean}`,
          salePrice: Math.round(rrp * (rrp > 500 ? 0.4 : 0.5))
        }

        console.log(`Row ${i} final product data:`, productData)

        const existingProduct = await Product.findOne({ ean: productData.ean })
        
        if (existingProduct) {
          await Product.updateOne({ ean: productData.ean }, { $set: productData })
          results.updated++
        } else {
          const product = new Product(productData)
          await product.save()
          results.imported++
        }
      } catch (error: any) {
        results.errors.push(`Row ${i+1}: ${error.message}`)
        console.error(`Row ${i} error:`, error)
      }
    }

    console.log('Final results:', results)

    return NextResponse.json({
      success: true,
      imported: results.imported,
      updated: results.updated,
      errors: results.errors.slice(0, 10), // Show first 10 errors
      totalRows: jsonData.length,
      debug: results.debug
    })
  } catch (error: any) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
