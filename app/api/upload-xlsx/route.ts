import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Product from '@/lib/schemas/Product'
import * as XLSX from 'xlsx'

// Category mapping function
function mapCategory(inputCategory: string): string {
  const categoryMap: { [key: string]: string } = {
    // Lighting & electrical → Bricolage
    'Lighting': 'Bricolage',
    'Christmas Lighting': 'Bricolage',
    'Light Ropes & Strings': 'Bricolage',
    
    // Christmas items → Bazar
    'Christmas Trees': 'Bazar',
    'Holiday Ornaments': 'Bazar',
    'Christmas Tree Skirts': 'Bazar',
    'Wreaths & Garlands': 'Bazar',
    
    // Furniture → Mobilier
    'Room Dividers': 'Mobilier',
    'Wall Shelves & Ledges': 'Mobilier',
    'Coffee Tables': 'Mobilier',
    'End Tables': 'Mobilier',
    'Headboards & Footboards': 'Mobilier',
    'Beds & Bed Frames': 'Mobilier',
    'Bedside Tables': 'Mobilier',
    'Shoe Racks & Organisers': 'Mobilier',
    'Plant Stands': 'Mobilier',
    'Rocking Chairs': 'Mobilier',
    'Arm Chairs, Recliners & Sleeper Chairs': 'Mobilier',
    'Folding Chairs & Stools': 'Mobilier',
    'Foot Rests': 'Mobilier',
    'Chaises Longues': 'Mobilier',
    'Kitchen & Dining Room Chairs': 'Mobilier',
    'Table & Bar Stools': 'Mobilier',
    'Kitchen & Dining Benches': 'Mobilier',
    'Sofas': 'Mobilier',
    
    // Storage → Mobilier
    'Storage Cabinets & Lockers': 'Mobilier',
    'Household Storage Boxes': 'Mobilier',
    'Household Storage Drawers': 'Mobilier',
    'Buffets & Sideboards': 'Mobilier',
    'Cabinets & Storage': 'Mobilier',
    'Closet Organisers & Garment Racks': 'Mobilier',
    'Media Storage Cabinets & Racks': 'Mobilier',
    'Bookcases & Standing Shelves': 'Mobilier',
    
    // Bathroom → Bricolage
    'Shower Heads': 'Bricolage',
    'Bathroom Basins': 'Bricolage',
    'Bathroom Furniture Sets': 'Bricolage',
    'Bathroom Vanity Units': 'Bricolage',
    
    // Outdoor → Bricolage
    'Outdoor Furniture Covers': 'Bricolage',
    'Outdoor Tables': 'Bricolage',
    'Outdoor Chairs': 'Bricolage',
    'Outdoor Sofas': 'Bricolage',
    'Outdoor Umbrellas & Sunshades': 'Bricolage',
    'Pots & Planters': 'Bricolage',
    
    // Textiles → Textile
    'Rugs': 'Textile',
    'Blankets': 'Textile',
    'Curtains & Drapes': 'Textile',
    'Slipcovers': 'Textile',
    'Chair & Sofa Cushions': 'Textile',
    
    // Default → Bazar
  }
  
  return categoryMap[inputCategory] || 'Bazar'
}

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
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false })

    const results = {
      imported: 0,
      updated: 0,
      errors: [] as string[]
    }

    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i]
      try {
        let ean = String((row as any)['EAN'] || '').trim()
        const name = String((row as any)['Name'] || '').trim()
        const inputCategory = String((row as any)['Category'] || '').trim()
        const rrpStr = String((row as any)['RRP'] || '0').replace(',', '.')
        const rrp = parseFloat(rrpStr) || 0
        const quantity = parseInt(String((row as any)['Quantity'] || '1')) || 1

        // Handle scientific notation for EAN
        if (ean.includes('E+')) {
          const num = Number(ean)
          if (!isNaN(num)) {
            ean = String(Math.round(num))
          }
        }

        if (!name || !ean || ean === '0') {
          results.errors.push(`Row ${i+1}: Missing name or valid EAN`)
          continue
        }

        const category = mapCategory(inputCategory)

        const productData = {
          ean,
          sku: String((row as any)['SKU'] || '').trim(),
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
      }
    }

    return NextResponse.json({
      success: true,
      imported: results.imported,
      updated: results.updated,
      errors: results.errors.slice(0, 5),
      totalRows: jsonData.length
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
