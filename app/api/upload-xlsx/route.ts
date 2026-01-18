
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

    const results = {
      imported: 0,
      updated: 0,
      errors: [] as string[]
    }

    for (const row of jsonData) {
      try {
        const productData = {
          ean: String((row as any)['EAN'] || (row as any)['ean'] || ''),
          sku: String((row as any)['SKU'] || (row as any)['sku'] || ''),
          name: String((row as any)['Name'] || (row as any)['name'] || (row as any)['Nom'] || ''),
          category: String((row as any)['Category'] || (row as any)['category'] || (row as any)['Catégorie'] || 'Bazar'),
          rrp: parseFloat(String((row as any)['RRP'] || (row as any)['rrp'] || (row as any)['Prix'] || '0')),
          quantity: parseInt(String((row as any)['Quantity'] || (row as any)['quantity'] || '1')),
          photos: [] as string[],
          status: 'sellable' as const,
          condition: "Non testé - Retour client",
          dimensions: '',
          weight: 0,
          slug: '',
          salePrice: 0
        }

        if (!productData.name || !productData.ean) {
          results.errors.push(`Missing name or EAN for row: ${JSON.stringify(row)}`)
          continue
        }

        const discount = productData.rrp > 500 ? 0.6 : 0.5
        productData.salePrice = Math.round(productData.rrp * (1 - discount))
        productData.slug = `${productData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${productData.ean}`

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
        results.errors.push(`Error processing row: ${error.message}`)
      }
    }

    return NextResponse.json({
      success: true,
      imported: results.imported,
      updated: results.updated,
      errors: results.errors
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}