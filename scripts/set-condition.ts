/**
 * Bulk or per-product condition assignment.
 *
 *   npm run set-condition -- --all=open-box-complet
 *   npm run set-condition -- --ean=1234567890123 --condition=defaut-signale
 *   npm run set-condition -- --dry-run --all=open-box-complet
 *
 * <condition> is either one of the CONDITION_GRID keys from lib/pricing.ts
 * (written to the product as that condition's French label) or any other
 * free text (written as-is).
 *
 * This only ever sets the `condition` field. It never touches salePrice,
 * discountPercent or comparePrice*: the pricing decision is to reprice
 * nothing automatically, so labelling a condition here never moves a
 * price. Run scripts/reprice.ts by hand afterwards if a price should
 * follow from it.
 *
 * Flags:
 *   --all=<condition>              set every product's condition
 *   --ean=<ean> --condition=<c>    set one product's condition, by EAN
 *   --dry-run                      print what would change; write nothing
 */

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import mongoose from 'mongoose'
import Product from '@/lib/schemas/Product'
import { CONDITION_GRID } from '@/lib/pricing'

const ROOT = process.cwd()

/** Minimal .env.local reader — this runs outside Next, which loads it. */
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
const ALL = option('all')
const EAN = option('ean')
const CONDITION = option('condition')

function resolveConditionText(value: string): string {
  const row = CONDITION_GRID.find((r) => r.key === value)
  return row ? row.label : value
}

async function main() {
  if (ALL && (EAN || CONDITION)) {
    throw new Error('--all cannot be combined with --ean/--condition; run one or the other.')
  }
  if (!ALL && !(EAN && CONDITION)) {
    throw new Error('Usage: --all=<condition>  OR  --ean=<ean> --condition=<condition>')
  }

  loadEnv()
  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error('MONGODB_URI is not set; put it in .env.local')
  await mongoose.connect(uri)

  if (ALL) {
    const text = resolveConditionText(ALL)
    const count = await Product.countDocuments({})
    console.log(`${DRY_RUN ? '[dry run] ' : ''}condition = "${text}" on ${count} product(s).`)
    if (!DRY_RUN) {
      const res = await Product.updateMany({}, { $set: { condition: text } })
      console.log(`Updated ${res.modifiedCount} product(s).`)
    }
  } else {
    const text = resolveConditionText(CONDITION!)
    const product = await Product.findOne({ ean: EAN })
    if (!product) throw new Error(`No product with EAN ${EAN}`)
    console.log(
      `${DRY_RUN ? '[dry run] ' : ''}${product.name} (${EAN}): "${product.condition || ''}" -> "${text}"`
    )
    if (!DRY_RUN) {
      await Product.updateOne({ ean: EAN }, { $set: { condition: text } })
      console.log('Updated.')
    }
  }

  await mongoose.disconnect()
}

main().catch(async (err) => {
  console.error(err instanceof Error ? err.message : err)
  await mongoose.disconnect().catch(() => {})
  process.exit(1)
})
