import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Product from '@/lib/schemas/Product'
import * as XLSX from 'xlsx'
import { requireAdmin } from '@/lib/adminAuth'
import { generateInternalRef, generatePseudoBarcode } from '@/lib/internalRef'
import { buildCreateDoc, buildUpdatePatch, parseProductRow } from '@/lib/xlsxImport'

const DIACRITICS_RANGE = new RegExp('[̀-ͯ]', 'g')
function slugify(name: string, ean: string) {
  const ascii = name.normalize('NFD').replace(DIACRITICS_RANGE, '')
  return `${ascii.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')}-${ean}`
}

export async function POST(request: NextRequest) {
  const denied = requireAdmin(request)
  if (denied) return denied
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
        const parsed = parseProductRow(row as Record<string, unknown>)
        if (!parsed) {
          results.errors.push(`Row ${i+1}: Missing name or valid EAN`)
          continue
        }

        const slug = slugify(parsed.name, parsed.ean)
        const existingProduct = await Product.findOne({ ean: parsed.ean })

        if (existingProduct) {
          await Product.updateOne({ ean: parsed.ean }, { $set: buildUpdatePatch(parsed, slug) })
          results.updated++
        } else {
          const product = new Product({
            ...buildCreateDoc(parsed, slug),
            internalRef: generateInternalRef(parsed.ean),
            pseudoBarcode: generatePseudoBarcode(parsed.ean),
          })
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
