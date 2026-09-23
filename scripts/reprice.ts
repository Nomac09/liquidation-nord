/**
 * One-off repricing pass over the catalogue.
 *
 *   npm run reprice            # dry run, writes docs/REPRICE_DRY_RUN.md
 *   npm run reprice -- --apply # actually writes to the database
 *
 * Flags:
 *   --apply                 write. Without it, nothing is saved, ever.
 *   --checked-at=YYYY-MM-DD assert that the comparison prices were
 *                           observed at vidaXL.fr on that day. Without
 *                           it, no comparison is dated, and therefore
 *                           none is displayed (see lib/pricing.ts).
 *   --default=<key>         condition to assume for articles whose own
 *                           text says nothing. One of the CONDITION_GRID
 *                           keys. Default: open-box-complet.
 *   --now=YYYY-MM-DD        pretend today is this, so a run can be
 *                           reproduced exactly.
 *   --limit=N               first N articles only, for a quick look.
 *   --keep-current           do not touch salePrice at all — the current
 *                           pricing decision is to reprice nothing. Only
 *                           discountPercent is back-computed, from rrp
 *                           against the article's own current price,
 *                           clamped to 20..60. Never sets comparePrice:
 *                           rrp has no source or observation date, so it
 *                           cannot back a displayed comparison (see
 *                           lib/pricing.ts on why an undated figure is
 *                           never shown).
 *
 * The comparison basis is `comparePrice` when the article has one, and
 * the imported `rrp` otherwise. That fallback is the honest starting
 * point and nothing more: `rrp` is a liquidation manifest's RRP column,
 * not a price anybody was observed charging, which is exactly why the
 * script refuses to stamp it with a source and a date unless a human
 * passes --checked-at to say they actually looked.
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import mongoose from 'mongoose'
import Product from '@/lib/schemas/Product'
import {
  COMPARE_SOURCE,
  CONDITION_GRID,
  DEFAULT_CONDITION_KEY,
  checkMarginFloor,
  clampDiscount,
  decideDiscount,
  getComparisonDisplay,
  priceFromCompare,
  stripeFee,
  type ConditionKey,
} from '@/lib/pricing'

const ROOT = process.cwd()

// ---------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------

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
      // No /s flag: tsconfig targets es5, and a value spanning lines is
      // not a case this file needs to handle.
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
const KEEP_CURRENT = flag('keep-current')

function parseDay(value: string | null, what: string): Date | null {
  if (!value) return null
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`--${what} must be YYYY-MM-DD, got "${value}"`)
  }
  return new Date(`${value}T00:00:00.000Z`)
}

const CHECKED_AT = parseDay(option('checked-at'), 'checked-at')
const NOW = parseDay(option('now'), 'now') ?? new Date()

const FALLBACK = (option('default') || DEFAULT_CONDITION_KEY) as ConditionKey
if (!CONDITION_GRID.some((r) => r.key === FALLBACK)) {
  throw new Error(
    `--default must be one of: ${CONDITION_GRID.map((r) => r.key).join(', ')}`
  )
}

// ---------------------------------------------------------------------
// The pass
// ---------------------------------------------------------------------

interface Row {
  ref: string
  name: string
  oldPrice: number
  newPrice: number
  /** What the grid produced, before the margin floor had its say. */
  proposedPrice: number
  basis: number
  discount: number
  condition: string
  guessed: boolean
  agedDays: number
  agedBonus: number
  floor: 'ok' | 'sous le plancher' | 'coût inconnu'
  marginHT: number | null
  recheck: string | null
  changed: boolean
}

function euro(n: number): string {
  return `${n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`
}

async function main() {
  loadEnv()
  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error('MONGODB_URI is not set; put it in .env.local')

  await mongoose.connect(uri)

  const query = Product.find({ status: { $in: ['sellable', 'sold'] } })
    .select(
      'internalRef name salePrice rrp comparePrice comparePriceSource comparePriceCheckedAt discountPercent unitCost condition conditionNote createdAt status'
    )
    .sort({ createdAt: -1 })
  if (LIMIT > 0) query.limit(LIMIT)
  const products = await query.lean()

  const rows: Row[] = []
  const writes: { _id: unknown; set: Record<string, unknown> }[] = []

  for (const p of products as unknown as Record<string, any>[]) {
    const oldPrice = Number(p.salePrice) || 0

    if (KEEP_CURRENT) {
      const rrp = Number(p.rrp) || 0
      const priorDiscount = Number(p.discountPercent) || 0
      const discountPercent =
        rrp > 0 ? clampDiscount(((rrp - oldPrice) / rrp) * 100) : priorDiscount

      rows.push({
        ref: p.internalRef || String(p._id).slice(-6),
        name: String(p.name || '').slice(0, 58),
        oldPrice,
        newPrice: oldPrice,
        proposedPrice: oldPrice,
        basis: rrp,
        discount: discountPercent,
        condition: '—',
        guessed: false,
        agedDays: 0,
        agedBonus: 0,
        floor: 'ok',
        marginHT: null,
        recheck: null,
        changed: rrp > 0 && discountPercent !== priorDiscount,
      })

      if (rrp > 0 && discountPercent !== priorDiscount) {
        writes.push({ _id: p._id, set: { discountPercent } })
      }
      continue
    }

    const basis = Number(p.comparePrice) || Number(p.rrp) || 0

    const decision = decideDiscount(p, { now: NOW, fallbackCondition: FALLBACK })
    const guessed = decision.conditionKey === 'inconnu'

    // No basis, no repricing. Nothing to compare against is not a reason
    // to invent one.
    const proposed = basis > 0 ? priceFromCompare(basis, decision.discountPercent) : oldPrice
    const margin = checkMarginFloor(proposed, p.unitCost)

    const newPrice = basis > 0 && margin.passes ? proposed : oldPrice
    const floor: Row['floor'] = !p.unitCost
      ? 'coût inconnu'
      : margin.passes
        ? 'ok'
        : 'sous le plancher'

    // Would the comparison actually be displayable after this run?
    const checkedAt = p.comparePriceCheckedAt || (CHECKED_AT ? CHECKED_AT : null)
    const display = getComparisonDisplay(
      {
        price: newPrice,
        comparePrice: basis,
        comparePriceCheckedAt: checkedAt,
        comparePriceSource: p.comparePriceSource || COMPARE_SOURCE,
        discountPercent: decision.discountPercent,
      },
      NOW
    )
    const recheck = display.show
      ? null
      : display.reason === 'no-date'
        ? 'jamais daté'
        : display.reason === 'stale'
          ? 'relevé de plus de 90 jours'
          : display.reason === 'not-cheaper'
            ? 'prix de comparaison non supérieur au nôtre'
            : 'aucun prix de comparaison'

    const changed = basis > 0 && margin.passes && newPrice !== oldPrice

    rows.push({
      ref: p.internalRef || String(p._id).slice(-6),
      name: String(p.name || '').slice(0, 58),
      oldPrice,
      newPrice,
      proposedPrice: proposed,
      basis,
      discount: decision.discountPercent,
      condition: decision.conditionLabel,
      guessed,
      agedDays: decision.agedDays,
      agedBonus: decision.agedBonus,
      floor,
      marginHT: margin.marginHT,
      recheck,
      changed,
    })

    if (basis > 0 && margin.passes) {
      const set: Record<string, unknown> = {
        salePrice: newPrice,
        discountPercent: decision.discountPercent,
        comparePrice: basis,
      }
      // Source and date are a human assertion, not an inference.
      if (CHECKED_AT) {
        set.comparePriceSource = COMPARE_SOURCE
        set.comparePriceCheckedAt = CHECKED_AT
      }
      writes.push({ _id: p._id, set })
    }
  }

  report(rows)

  if (!APPLY) {
    console.log(`\nDRY RUN — nothing written. ${writes.length} article(s) would change.`)
    console.log('Re-run with --apply once the table above has been reviewed.\n')
  } else {
    let written = 0
    for (const w of writes) {
      await Product.updateOne({ _id: w._id }, { $set: w.set })
      written += 1
    }
    console.log(`\nAPPLIED — ${written} article(s) updated.\n`)
  }

  await mongoose.disconnect()
}

// ---------------------------------------------------------------------
// The report
// ---------------------------------------------------------------------

function report(rows: Row[]) {
  const changed = rows.filter((r) => r.changed)
  const blocked = rows.filter((r) => r.floor === 'sous le plancher')
  const recheck = rows.filter((r) => r.recheck)
  const guessed = rows.filter((r) => r.guessed)

  const lines: string[] = []
  lines.push('# Reprice — dry run')
  lines.push('')
  lines.push(
    `Généré le ${NOW.toISOString().slice(0, 10)} par \`scripts/reprice.ts\`. ` +
      `Aucune écriture : ce fichier est le résultat d'un \`--dry-run\`.`
  )
  if (KEEP_CURRENT) {
    lines.push('')
    lines.push(
      '**Mode `--keep-current`** : aucun prix ne bouge. Seul `discountPercent` est ' +
        'recalculé à partir du `rrp` et du prix actuel, borné à 20–60 %.'
    )
  }
  lines.push('')
  lines.push('| | |')
  lines.push('|---|---|')
  lines.push(`| Articles examinés | ${rows.length} |`)
  lines.push(`| Prix qui changeraient | ${changed.length} |`)
  lines.push(`| Bloqués par le plancher de marge | ${blocked.length} |`)
  lines.push(`| Sans comparaison affichable (à revérifier) | ${recheck.length} |`)
  lines.push(`| État non déterminé, remise par défaut | ${guessed.length} |`)
  lines.push(`| Remise par défaut utilisée | \`${FALLBACK}\` |`)
  lines.push(
    `| Date de relevé | ${CHECKED_AT ? CHECKED_AT.toISOString().slice(0, 10) : '_non fournie_ (--checked-at)'} |`
  )
  lines.push('')

  // The single fact a reviewer must not miss. The grid's defaults are
  // measured against a comparison price; the catalogue's current prices
  // were computed as a flat 50 % or 60 % off the same figure at import.
  // Those are different numbers, and the difference is a direction.
  const up = changed.filter((r) => r.newPrice > r.oldPrice)
  const down = changed.filter((r) => r.newPrice < r.oldPrice)
  const sumOld = changed.reduce((t, r) => t + r.oldPrice, 0)
  const sumNew = changed.reduce((t, r) => t + r.newPrice, 0)
  if (changed.length > 0) {
    lines.push('## Sens des variations')
    lines.push('')
    lines.push(`- ${up.length} prix **en hausse**, ${down.length} **en baisse**.`)
    lines.push(
      `- Valeur du stock concerné : ${euro(sumOld)} → ${euro(sumNew)} ` +
        `(${sumNew >= sumOld ? '+' : ''}${(((sumNew - sumOld) / (sumOld || 1)) * 100).toFixed(1)} %).`
    )
    if (up.length > down.length) {
      lines.push('')
      lines.push(
        '> **À lire avant tout `--apply`.** La majorité des prix monte. Ce n’est pas ' +
          'un bug de la grille : les prix actuels ont été calculés à l’import comme une ' +
          'remise forfaitaire de 50 % (ou 60 % au-dessus de 500 €) sur la colonne RRP du ' +
          'manifeste, alors que la grille par défaut de la spec plafonne à 40 % pour un ' +
          'article open-box. Deux décisions possibles : accepter la hausse, ou lancer la ' +
          'grille avec `--default=defaut-signale` (50 %) pour rester proche des prix ' +
          'actuels. Le vrai correctif est de renseigner l’état réel des articles.'
      )
    }
    lines.push('')
  }

  lines.push('## Tableau')
  lines.push('')
  lines.push('| Réf | Article | Prix actuel | Nouveau prix | Remise | État | Plancher |')
  lines.push('|---|---|---:|---:|---:|---|---|')
  for (const r of rows) {
    const aged = r.agedBonus ? ` +${r.agedBonus} pts (${r.agedDays} j en stock)` : ''
    lines.push(
      `| ${r.ref} | ${r.name.replace(/\|/g, '/')} | ${euro(r.oldPrice)} | ` +
        `${r.newPrice === r.oldPrice ? '_inchangé_' : `**${euro(r.newPrice)}**`} | ` +
        `${r.discount} %${aged} | ${r.condition}${r.guessed ? ' ⚠︎' : ''} | ` +
        `${r.floor}${r.marginHT !== null ? ` (${euro(r.marginHT)} HT)` : ''} |`
    )
  }
  lines.push('')

  if (blocked.length > 0) {
    lines.push('## Bloqués par le plancher de marge')
    lines.push('')
    lines.push(
      'Le prix proposé ne couvrait pas le coût d’achat plus la commission Stripe ' +
        `(${(0.015 * 100).toFixed(1)} % + ${euro(0.25)}). Prix actuel conservé.`
    )
    lines.push('')
    lines.push('| Réf | Article | Prix proposé | Marge HT | Prix conservé |')
    lines.push('|---|---|---:|---:|---:|')
    for (const r of blocked) {
      lines.push(
        `| ${r.ref} | ${r.name.replace(/\|/g, '/')} | ${euro(r.proposedPrice)} | ` +
          `${euro(r.marginHT ?? 0)} | ${euro(r.oldPrice)} |`
      )
    }
    lines.push('')
  }

  if (recheck.length > 0) {
    lines.push('## À revérifier')
    lines.push('')
    lines.push(
      'Aucune comparaison ne sera affichée pour ces articles tant que le prix ' +
        'constaté chez le distributeur n’aura pas été relevé et daté. Le prix ' +
        'Souqify s’affiche seul, ce qui est correct ; c’est le badge et la ligne ' +
        '« prix constaté » qui disparaissent.'
    )
    lines.push('')
    lines.push('| Réf | Article | Raison |')
    lines.push('|---|---|---|')
    for (const r of recheck) {
      lines.push(`| ${r.ref} | ${r.name.replace(/\|/g, '/')} | ${r.recheck} |`)
    }
    lines.push('')
  }

  if (guessed.length > 0) {
    lines.push('## État non déterminé')
    lines.push('')
    lines.push(
      `Ni \`condition\` ni \`conditionNote\` ne disent dans quel état l'article est. ` +
        `La remise \`${FALLBACK}\` leur a été appliquée par défaut. Relire cette liste ` +
        'avant tout `--apply` : un article neuf dans son emballage intact ne mérite ' +
        'pas la même remise qu’un retour avec un défaut signalé.'
    )
    lines.push('')
    lines.push('| Réf | Article | Remise appliquée |')
    lines.push('|---|---|---:|')
    for (const r of guessed) {
      lines.push(`| ${r.ref} | ${r.name.replace(/\|/g, '/')} | ${r.discount} % |`)
    }
    lines.push('')
  }

  const out = join(ROOT, 'docs', 'REPRICE_DRY_RUN.md')
  writeFileSync(out, lines.join('\n') + '\n', 'utf8')

  // Terminal version: the same table, narrower.
  console.log('')
  console.log(
    ['RÉF'.padEnd(10), 'ARTICLE'.padEnd(34), 'ACTUEL'.padStart(10), 'NOUVEAU'.padStart(10), 'REM'.padStart(5), 'PLANCHER'].join(
      '  '
    )
  )
  console.log('-'.repeat(86))
  for (const r of rows) {
    console.log(
      [
        r.ref.padEnd(10),
        r.name.slice(0, 34).padEnd(34),
        euro(r.oldPrice).padStart(10),
        (r.newPrice === r.oldPrice ? '=' : euro(r.newPrice)).padStart(10),
        `${r.discount}%`.padStart(5),
        r.floor,
      ].join('  ')
    )
  }
  console.log('')
  console.log(`Rapport complet : docs/REPRICE_DRY_RUN.md`)
  console.log(
    `Commission Stripe utilisée pour le plancher : 1,5 % + ${euro(0.25)} ` +
      `(ex. ${euro(stripeFee(50))} sur un article à ${euro(50)}).`
  )
}

main().catch(async (err) => {
  console.error(err instanceof Error ? err.message : err)
  await mongoose.disconnect().catch(() => {})
  process.exit(1)
})
