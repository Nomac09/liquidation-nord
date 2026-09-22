/**
 * Manual size-class override for one product, by EAN.
 *
 *   npm run set-size -- --ean=1234567890123 --class=L
 *
 * Sets `sizeClassOverride`, which always wins over whatever
 * scripts/classify-size.ts would otherwise compute — for the article the
 * cascade keeps getting wrong, rather than adjusting keyword lists to
 * chase a single product.
 *
 * Flags:
 *   --ean=<ean>       required
 *   --class=<S|M|L|XL> required
 *   --dry-run         print what would change; write nothing
 */

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import mongoose from 'mongoose'
import Product from '@/lib/schemas/Product'

const ROOT = process.cwd()

function loadEnv() {
  for (const file of ['.env.local', '.env']) {
    let raw: string
    try {
      raw = readFileSync(join(ROOT, file), 'utf8')
    } catch {
      continue
    }
    for (const line of raw.split('\n')) {
      const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line)
      if (!match) continue
      const [, key, rawValue] = match
      if (process.env[key]) continue
      process.env[key] = rawValue.trim().replace(/^(['"])([\s\S]*)\1$/, '$2')
    }
  }
}

const args = process.argv.slice(2)
function flag(name: string): boolean {
  return args.includes(`--${name}`)
}
function option(name: string): string | null {
  const hit = args.find((a) => a.startsWith(`--${name}=`))
  return hit ? hit.slice(name.length + 3) : null
}

const DRY_RUN = flag('dry-run')
const EAN = option('ean')
const CLASS = option('class')
const VALID_CLASSES = ['S', 'M', 'L', 'XL']

async function main() {
  if (!EAN || !CLASS) {
    throw new Error('Usage: --ean=<ean> --class=<S|M|L|XL>')
  }
  if (!VALID_CLASSES.includes(CLASS)) {
    throw new Error(`--class must be one of: ${VALID_CLASSES.join(', ')}`)
  }

  loadEnv()
  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error('MONGODB_URI is not set; put it in .env.local')
  await mongoose.connect(uri)

  const product = await Product.findOne({ ean: EAN })
  if (!product) throw new Error(`No product with EAN ${EAN}`)

  console.log(
    `${DRY_RUN ? '[dry run] ' : ''}${product.name} (${EAN}): sizeClassOverride ` +
      `"${product.sizeClassOverride || ''}" -> "${CLASS}"`
  )
  if (!DRY_RUN) {
    await Product.updateOne({ ean: EAN }, { $set: { sizeClassOverride: CLASS } })
    console.log('Updated.')
  }

  await mongoose.disconnect()
}

main().catch(async (err) => {
  console.error(err instanceof Error ? err.message : err)
  await mongoose.disconnect().catch(() => {})
  process.exit(1)
})
