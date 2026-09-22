/**
 * Assigns every product a shipping size class (S/M/L/XL, or "à vérifier").
 *
 *   npm run classify-size -- --dry-run   # writes docs/SIZE_CLASS_DRY_RUN.md only
 *   npm run classify-size -- --apply     # also writes sizeClass to the database
 *
 * See lib/sizeClassifier.ts for the cascade: a manual sizeClassOverride
 * (set with `npm run set-size`) always wins first, then supplier data,
 * name-parsed measurements, a French keyword dictionary, or "à vérifier".
 *
 * Nothing is written to the database without --apply, dry-run flag or
 * not. --apply only ever sets `sizeClass` on articles the cascade
 * actually resolved on its own; an "à vérifier" article is left alone
 * rather than written with no class, and an overridden article is left
 * alone too, since sizeClassOverride is already the authoritative value.
 *
 * Flags:
 *   --apply     write sizeClass to the database. Without it, nothing is saved.
 *   --limit=N   first N articles only, for a quick look.
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import mongoose from 'mongoose'
import Product from '@/lib/schemas/Product'
import { getReturnCostEstimate, RELAY_MAX_KG, RELAY_MAX_LONGEST_SIDE_CM, RELAY_MAX_SUM_DIMENSIONS_CM } from '@/lib/shipping'
import { classifyProductSize, type SizeClassification } from '@/lib/sizeClassifier'

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

const APPLY = flag('apply')
const LIMIT = Number(option('limit')) || 0

function euro(n: number): string {
  return `${n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`
}

interface Row {
  ref: string
  name: string
  weightKg: number | null
  weightLabel: string
  dimsLabel: string
  rule: SizeClassification['rule']
  detail: string | null
  matchedKeyword: string | null
  sizeClass: SizeClassification['sizeClass']
  shippingMode: string
  returnCostLabel: string
}

/** Reads the previous run's per-ref class out of the report this script itself writes. */
function parsePreviousClasses(path: string): Map<string, string> {
  const map = new Map<string, string>()
  let raw: string
  try {
    raw = readFileSync(path, 'utf8')
  } catch {
    return map
  }
  for (const line of raw.split('\n')) {
    const refMatch = /^\|\s*(\S+)\s*\|/.exec(line)
    if (!refMatch || !/^SQ-/.test(refMatch[1])) continue
    const classMatch = /\*\*(S|M|L|XL)\*\*/.exec(line)
    const cls = classMatch ? classMatch[1] : line.includes('à vérifier') ? 'à vérifier' : null
    if (cls) map.set(refMatch[1], cls)
  }
  return map
}

/**
 * Shipping mode and return cost from whatever measurement the cascade
 * found. Only computed when a numeric weight is known — `getReturnCostEstimate`
 * needs one, and inventing one for a dims-only or keyword-only match
 * would produce a confident-looking number nobody actually measured.
 */
function shippingFor(c: SizeClassification): { mode: string; returnCostLabel: string } {
  const dims = c.dimsCm
  const sizeFitsRelay =
    dims === null || (Math.max(...dims) <= RELAY_MAX_LONGEST_SIDE_CM && dims.reduce((a, b) => a + b, 0) <= RELAY_MAX_SUM_DIMENSIONS_CM)

  if (c.weightKg === null) {
    if (dims !== null && !sizeFitsRelay) {
      return { mode: 'Domicile (Cocolis)', returnCostLabel: 'à vérifier (poids inconnu)' }
    }
    return { mode: 'à vérifier', returnCostLabel: 'à vérifier (poids inconnu)' }
  }

  const weightFitsRelay = c.weightKg <= RELAY_MAX_KG
  if (weightFitsRelay && sizeFitsRelay) {
    const estimate = getReturnCostEstimate({ weight: c.weightKg })
    return { mode: 'Point relais', returnCostLabel: euro(estimate.cost) }
  }
  const estimate = getReturnCostEstimate({ weight: c.weightKg })
  return { mode: 'Domicile (Cocolis)', returnCostLabel: euro(estimate.cost) }
}

async function main() {
  loadEnv()
  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error('MONGODB_URI is not set; put it in .env.local')
  await mongoose.connect(uri)

  const query = Product.find({ status: { $in: ['sellable', 'sold'] } })
    .select('internalRef name weight dimensions sizeClassOverride')
    .sort({ createdAt: -1 })
  if (LIMIT > 0) query.limit(LIMIT)
  const products = await query.lean()

  const rows: Row[] = []
  const writes: { _id: unknown; sizeClass: 'S' | 'M' | 'L' | 'XL' }[] = []

  for (const p of products as unknown as Record<string, any>[]) {
    const classification = classifyProductSize({
      name: p.name,
      weight: p.weight,
      dimensions: p.dimensions,
      sizeClassOverride: p.sizeClassOverride,
    })
    const shipping = shippingFor(classification)

    rows.push({
      ref: p.internalRef || String(p._id).slice(-6),
      name: String(p.name || '').slice(0, 58),
      weightKg: classification.weightKg,
      weightLabel: classification.weightKg !== null ? `${classification.weightKg} kg` : '—',
      dimsLabel: classification.dimsCm !== null ? `${classification.dimsCm.join(' x ')} cm` : '—',
      rule: classification.rule,
      detail: classification.detail,
      matchedKeyword: classification.matchedKeyword,
      sizeClass: classification.sizeClass,
      shippingMode: shipping.mode,
      returnCostLabel: shipping.returnCostLabel,
    })

    // An override is already authoritative in sizeClassOverride; writing
    // it into sizeClass too would just be a second copy of the same call.
    if (classification.sizeClass !== 'à vérifier' && classification.rule !== 'override') {
      writes.push({ _id: p._id, sizeClass: classification.sizeClass })
    }
  }

  report(rows)

  if (!APPLY) {
    console.log(`\nDRY RUN — nothing written. ${writes.length} article(s) would get a sizeClass.`)
    console.log('Re-run with --apply once the report has been reviewed.\n')
  } else {
    let written = 0
    for (const w of writes) {
      await Product.updateOne({ _id: w._id }, { $set: { sizeClass: w.sizeClass } })
      written += 1
    }
    console.log(`\nAPPLIED — ${written} article(s) updated.\n`)
  }

  await mongoose.disconnect()
}

const RULE_LABEL: Record<SizeClassification['rule'], string> = {
  override: 'forcé manuellement',
  'supplier-data': 'données fournisseur',
  'name-parsed': 'nom du produit',
  keyword: 'mot-clé',
  unknown: 'aucune',
}

function ruleLabelFor(r: Row): string {
  if (r.detail) return `${RULE_LABEL[r.rule]} — ${r.detail}`
  if (r.matchedKeyword) return `${RULE_LABEL[r.rule]} (« ${r.matchedKeyword} »)`
  return RULE_LABEL[r.rule]
}

function report(rows: Row[]) {
  const out = join(ROOT, 'docs', 'SIZE_CLASS_DRY_RUN.md')
  const previousClasses = parsePreviousClasses(out)

  const toVerify = rows.filter((r) => r.sizeClass === 'à vérifier')
  const byRule = rows.reduce<Record<string, number>>((acc, r) => {
    acc[r.rule] = (acc[r.rule] || 0) + 1
    return acc
  }, {})
  const byClass = rows.reduce<Record<string, number>>((acc, r) => {
    acc[r.sizeClass] = (acc[r.sizeClass] || 0) + 1
    return acc
  }, {})

  const lines: string[] = []
  lines.push('# Classification de taille — dry run')
  lines.push('')
  lines.push(
    `Généré par \`scripts/classify-size.ts\`. Aucune écriture : ce fichier est le résultat d'un \`--dry-run\`.`
  )
  lines.push('')
  lines.push('## Limites Mondial Relay utilisées')
  lines.push('')
  lines.push(
    `Poids max ${RELAY_MAX_KG} kg, plus grande dimension ≤ ${RELAY_MAX_LONGEST_SIDE_CM} cm, ` +
      `somme des trois dimensions ≤ ${RELAY_MAX_SUM_DIMENSIONS_CM} cm (voir \`lib/shipping.ts\`).`
  )
  lines.push('')
  lines.push('| | |')
  lines.push('|---|---|')
  lines.push(`| Articles examinés | ${rows.length} |`)
  lines.push(`| Classe S | ${byClass.S || 0} |`)
  lines.push(`| Classe M | ${byClass.M || 0} |`)
  lines.push(`| Classe L | ${byClass.L || 0} |`)
  lines.push(`| Classe XL | ${byClass.XL || 0} |`)
  lines.push(`| À vérifier | ${toVerify.length} |`)
  lines.push(`| Via données fournisseur | ${byRule['supplier-data'] || 0} |`)
  lines.push(`| Via nom du produit | ${byRule['name-parsed'] || 0} |`)
  lines.push(`| Via mot-clé | ${byRule['keyword'] || 0} |`)
  lines.push('')

  if (previousClasses.size > 0) {
    const previousByClass = new Map<string, number>()
    previousClasses.forEach((cls) => {
      previousByClass.set(cls, (previousByClass.get(cls) || 0) + 1)
    })
    lines.push('## Comparaison avant / après')
    lines.push('')
    lines.push('| Classe | Avant | Après |')
    lines.push('|---|---:|---:|')
    for (const cls of ['S', 'M', 'L', 'XL', 'à vérifier']) {
      lines.push(`| ${cls} | ${previousByClass.get(cls) || 0} | ${byClass[cls] || 0} |`)
    }
    lines.push('')
  }

  lines.push('## Tableau')
  lines.push('')
  lines.push('| Réf | Article | Poids | Dimensions | Règle | Classe | Mode | Retour |')
  lines.push('|---|---|---:|---|---|---|---|---:|')
  for (const r of rows) {
    const rule = ruleLabelFor(r)
    lines.push(
      `| ${r.ref} | ${r.name.replace(/\|/g, '/')} | ${r.weightLabel} | ${r.dimsLabel} | ${rule} | ` +
        `${r.sizeClass === 'à vérifier' ? '⚠︎ à vérifier' : `**${r.sizeClass}**`} | ${r.shippingMode} | ${r.returnCostLabel} |`
    )
  }
  lines.push('')

  const changed = rows.filter((r) => {
    const previous = previousClasses.get(r.ref)
    return previous !== undefined && previous !== r.sizeClass
  })
  if (previousClasses.size > 0) {
    lines.push('## Changements vs la version précédente')
    lines.push('')
    if (changed.length === 0) {
      lines.push('Aucun changement de classe.')
    } else {
      lines.push('| Réf | Article | Ancienne classe | Nouvelle classe | Règle qui a décidé |')
      lines.push('|---|---|---|---|---|')
      for (const r of changed) {
        lines.push(
          `| ${r.ref} | ${r.name.replace(/\|/g, '/')} | ${previousClasses.get(r.ref)} | ` +
            `${r.sizeClass} | ${ruleLabelFor(r)} |`
        )
      }
    }
    lines.push('')
  }

  const heaviestS = rows
    .filter((r) => r.sizeClass === 'S' && r.weightKg !== null)
    .sort((a, b) => (b.weightKg ?? 0) - (a.weightKg ?? 0))
    .slice(0, 20)
  if (heaviestS.length > 0) {
    lines.push('## 20 articles S les plus lourds (à vérifier les bornes)')
    lines.push('')
    lines.push('| Réf | Article | Poids | Règle |')
    lines.push('|---|---|---:|---|')
    for (const r of heaviestS) {
      lines.push(`| ${r.ref} | ${r.name.replace(/\|/g, '/')} | ${r.weightLabel} | ${ruleLabelFor(r)} |`)
    }
    lines.push('')
  }

  const lightestBulky = rows
    .filter((r) => (r.sizeClass === 'L' || r.sizeClass === 'XL') && r.weightKg !== null)
    .sort((a, b) => (a.weightKg ?? 0) - (b.weightKg ?? 0))
    .slice(0, 20)
  if (lightestBulky.length > 0) {
    lines.push('## 20 articles L/XL les plus légers (à vérifier les bornes)')
    lines.push('')
    lines.push('| Réf | Article | Poids | Classe | Règle |')
    lines.push('|---|---|---:|---|---|')
    for (const r of lightestBulky) {
      lines.push(
        `| ${r.ref} | ${r.name.replace(/\|/g, '/')} | ${r.weightLabel} | ${r.sizeClass} | ${ruleLabelFor(r)} |`
      )
    }
    lines.push('')
  }

  if (toVerify.length > 0) {
    lines.push('## À vérifier')
    lines.push('')
    lines.push(
      'Aucune donnée fournisseur, aucune mesure dans le nom, aucun mot-clé reconnu. ' +
        'Renseigner le poids ou les dimensions puis relancer le script.'
    )
    lines.push('')
    lines.push('| Réf | Article |')
    lines.push('|---|---|')
    for (const r of toVerify) {
      lines.push(`| ${r.ref} | ${r.name.replace(/\|/g, '/')} |`)
    }
    lines.push('')
  }

  writeFileSync(out, lines.join('\n') + '\n', 'utf8')

  console.log('')
  console.log(
    ['RÉF'.padEnd(10), 'ARTICLE'.padEnd(34), 'CLASSE'.padStart(12), 'MODE'.padStart(18)].join('  ')
  )
  console.log('-'.repeat(80))
  for (const r of rows) {
    console.log(
      [r.ref.padEnd(10), r.name.slice(0, 34).padEnd(34), r.sizeClass.padStart(12), r.shippingMode.padStart(18)].join(
        '  '
      )
    )
  }
  console.log('')
  console.log(`Rapport complet : docs/SIZE_CLASS_DRY_RUN.md`)
}

main().catch(async (err) => {
  console.error(err instanceof Error ? err.message : err)
  await mongoose.disconnect().catch(() => {})
  process.exit(1)
})
