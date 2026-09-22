// Assigns each product a rough handling/shipping size class — S, M, L or
// XL — for warehouse packing and for deciding whether an article can
// realistically travel by Mondial Relay at all.
//
// Four rules, tried in order, the first that has real data wins:
//
//   (a) supplier data   — the product's own `weight` and `dimensions`
//       fields, when present and non-zero.
//   (b) name-parsed      — dimensions or a weight written into the
//       product name itself ("450x300 cm", "60 x 50,5 x 8 cm", "45 kg").
//   (c) keyword          — a French keyword dictionary matched against
//       the name, for articles that carry no measurement anywhere.
//   (d) unknown          — none of the above found anything; flagged
//       "à vérifier" rather than guessed.
//
// Whenever a weight and/or dimensions are known, the class is the worse
// (larger) of what the weight alone implies and what the longest single
// dimension and the summed dimensions imply — a long, light item (a
// parasol pole, a length of fencing) must not be waved into a relay
// parcel just because it weighs nothing.
//
// Exception: when the supplier gives a weight but no package dimensions,
// the name's dimensions are used as a stand-in for the package's — EXCEPT
// for foldable/rollable fabric articles (tissu, toile, tente, tapis,
// housse, bâche...), whose name states the size of the unfolded product,
// not the folded parcel. Those are classified by weight plus a fixed
// keyword floor instead (see FOLDABLE_MIN_CLASS below).

import { RELAY_MAX_KG, RELAY_MAX_LONGEST_SIDE_CM, RELAY_MAX_SUM_DIMENSIONS_CM } from './shipping'

export type SizeClass = 'S' | 'M' | 'L' | 'XL'
export type SizeRule = 'supplier-data' | 'name-parsed' | 'keyword' | 'unknown'

const CLASS_ORDER: SizeClass[] = ['S', 'M', 'L', 'XL']

export interface SizeClassification {
  sizeClass: SizeClass | 'à vérifier'
  rule: SizeRule
  weightKg: number | null
  dimsCm: number[] | null
  matchedKeyword: string | null
  /** Human-readable note on how the class was actually reached, for the report. */
  detail: string | null
}

function toNum(s: string): number {
  return parseFloat(s.replace(',', '.'))
}

// "450x300 cm", "60 x 50,5 x 8 cm" — two or three numbers, "x" or "×"
// separated, ending in "cm".
const DIMENSION_PATTERN =
  /(\d+(?:[.,]\d+)?)\s*[x×]\s*(\d+(?:[.,]\d+)?)(?:\s*[x×]\s*(\d+(?:[.,]\d+)?))?\s*cm/i

// "45 kg" — not "kgs", not part of a longer unit.
const WEIGHT_PATTERN = /(\d+(?:[.,]\d+)?)\s*kg\b/i

export function parseDimensionsCm(text: string): number[] | null {
  const m = DIMENSION_PATTERN.exec(text)
  if (!m) return null
  const dims = [m[1], m[2], m[3]].filter((v): v is string => Boolean(v)).map(toNum)
  return dims.length ? dims : null
}

export function parseWeightKg(text: string): number | null {
  const m = WEIGHT_PATTERN.exec(text)
  if (!m) return null
  const kg = toNum(m[1])
  return kg > 0 ? kg : null
}

function rankFromWeight(kg: number): number {
  if (kg <= 5) return 0
  if (kg <= 15) return 1
  if (kg <= RELAY_MAX_KG) return 2
  return 3
}

function rankFromLongestSide(cm: number): number {
  if (cm <= 50) return 0
  if (cm <= 100) return 1
  if (cm <= RELAY_MAX_LONGEST_SIDE_CM) return 2
  return 3
}

function rankFromSummedDimensions(cm: number): number {
  // Below the relay ceiling, the sum alone doesn't push the class up —
  // longest side and weight already cover that. Above it, the parcel
  // cannot go to a relay regardless of weight, which XL must reflect.
  return cm > RELAY_MAX_SUM_DIMENSIONS_CM ? 3 : 0
}

/** The worse of what the weight and the dimensions each imply. */
export function classifyFromMeasurements(weightKg: number | null, dimsCm: number[] | null): SizeClass {
  let rank = 0
  if (weightKg !== null) rank = Math.max(rank, rankFromWeight(weightKg))
  if (dimsCm && dimsCm.length > 0) {
    rank = Math.max(rank, rankFromLongestSide(Math.max(...dimsCm)))
    rank = Math.max(rank, rankFromSummedDimensions(dimsCm.reduce((a, b) => a + b, 0)))
  }
  return CLASS_ORDER[rank]
}

// Fabric/foldable/rollable articles whose name states the *unfolded*
// product's size ("Toile de rechange pour auvent... 450x300 cm", "Tapis
// en peluche... 139 cm"), not the size of the parcel it ships in. Falling
// back to those name-parsed dimensions for these would classify a folded
// tarp the size of its unfolded canvas — the opposite of what the
// longest-side/sum rule exists for. Weight, plus a keyword floor for the
// handful where "light but bulky when unfolded" still needs a minimum,
// is the only signal used for these.
const FOLDABLE_FABRIC_KEYWORDS = [
  'tissu',
  'toile',
  "voile d'ombrage",
  'voile d’ombrage',
  'tente',
  'sac de couchage',
  'bâche',
  'bache',
  'tapis',
  'housse',
  'couverture de piscine',
]

function isFoldableFabric(name: string): boolean {
  const normalized = name.toLowerCase()
  return FOLDABLE_FABRIC_KEYWORDS.some((word) => normalized.includes(word))
}

// Minimum class for specific foldable items whose weight alone
// understates how much space they need to handle — given by the
// business, not derived. Anything else on the foldable list has no
// floor: it is weight-only.
const FOLDABLE_MIN_CLASS: { phrase: string; min: SizeClass }[] = [
  { phrase: 'tente de réception', min: 'L' },
  { phrase: 'tente de reception', min: 'L' },
  { phrase: 'tapis', min: 'M' },
]

function foldableFloor(name: string): { rank: number; phrase: string | null } {
  const normalized = name.toLowerCase()
  let best: { rank: number; phrase: string } | null = null
  for (const { phrase, min } of FOLDABLE_MIN_CLASS) {
    if (normalized.includes(phrase)) {
      const rank = CLASS_ORDER.indexOf(min)
      if (!best || rank > best.rank) best = { rank, phrase }
    }
  }
  return best ? { rank: best.rank, phrase: best.phrase } : { rank: 0, phrase: null }
}

interface KeywordGroup {
  sizeClass: SizeClass
  words: string[]
}

// Given by the business, not derived: a rough French vocabulary for
// articles that carry no measurement anywhere on the sheet or in the
// name. Multi-word phrases first so "tente de réception" doesn't fall
// through to a shorter, unrelated match.
const KEYWORD_GROUPS: KeywordGroup[] = [
  { sizeClass: 'S', words: ['coussin', 'housse', 'tissu'] },
  { sizeClass: 'M', words: ['parasol', 'chaise', 'étagère', 'etagere', 'tapis'] },
  { sizeClass: 'L', words: ['tente de réception', 'tente de reception', 'table', 'auvent', 'remorque'] },
  {
    sizeClass: 'XL',
    words: ['canapé', 'canape', 'salon de jardin', 'abri', 'dôme de piscine', 'dome de piscine'],
  },
]

/**
 * The largest (most conservative) size class among every keyword that
 * matches — a name that reads "chaise de salon de jardin" is safer
 * treated as XL than as M.
 */
export function classifyByKeyword(text: string): { sizeClass: SizeClass; keyword: string } | null {
  const normalized = text.toLowerCase()
  let best: { sizeClass: SizeClass; keyword: string; rank: number } | null = null
  for (const group of KEYWORD_GROUPS) {
    for (const word of group.words) {
      if (normalized.includes(word)) {
        const rank = CLASS_ORDER.indexOf(group.sizeClass)
        if (!best || rank > best.rank) best = { sizeClass: group.sizeClass, keyword: word, rank }
      }
    }
  }
  return best ? { sizeClass: best.sizeClass, keyword: best.keyword } : null
}

export interface ProductForSizeClassification {
  name: string
  weight?: number | null
  dimensions?: string | null
}

export function classifyProductSize(p: ProductForSizeClassification): SizeClassification {
  const supplierWeight = p.weight && p.weight > 0 ? p.weight : null
  const supplierDims = p.dimensions ? parseDimensionsCm(p.dimensions) : null

  if (supplierWeight !== null || supplierDims !== null) {
    // Supplier package dimensions exist — trust them as-is, fabric or not.
    if (supplierDims !== null) {
      return {
        sizeClass: classifyFromMeasurements(supplierWeight, supplierDims),
        rule: 'supplier-data',
        weightKg: supplierWeight,
        dimsCm: supplierDims,
        matchedKeyword: null,
        detail: null,
      }
    }

    // Weight only, no package dimensions. A foldable/fabric item's name
    // describes the unfolded product, not the parcel, so name dimensions
    // are never used for these — weight plus a keyword floor instead.
    if (supplierWeight !== null && isFoldableFabric(p.name)) {
      const floor = foldableFloor(p.name)
      const rank = Math.max(rankFromWeight(supplierWeight), floor.rank)
      return {
        sizeClass: CLASS_ORDER[rank],
        rule: 'supplier-data',
        weightKg: supplierWeight,
        dimsCm: null,
        matchedKeyword: floor.phrase,
        detail: floor.phrase
          ? `poids + plancher mot-clé « ${floor.phrase} » (article pliable/enroulable)`
          : 'poids seul (article pliable/enroulable, dimensions du nom ignorées)',
      }
    }

    // Not a foldable item: the name's dimensions are a reasonable stand-in
    // for the package's, so use them for the longest-side/sum check.
    const nameDimsFallback = supplierWeight !== null ? parseDimensionsCm(p.name) : null
    return {
      sizeClass: classifyFromMeasurements(supplierWeight, nameDimsFallback),
      rule: 'supplier-data',
      weightKg: supplierWeight,
      dimsCm: nameDimsFallback,
      matchedKeyword: null,
      detail: nameDimsFallback ? 'poids fournisseur + dimensions du nom (secours)' : null,
    }
  }

  const nameDims = parseDimensionsCm(p.name)
  const nameWeight = parseWeightKg(p.name)
  if (nameDims !== null || nameWeight !== null) {
    return {
      sizeClass: classifyFromMeasurements(nameWeight, nameDims),
      rule: 'name-parsed',
      weightKg: nameWeight,
      dimsCm: nameDims,
      matchedKeyword: null,
      detail: null,
    }
  }

  const keyword = classifyByKeyword(p.name)
  if (keyword) {
    return {
      sizeClass: keyword.sizeClass,
      rule: 'keyword',
      weightKg: null,
      dimsCm: null,
      matchedKeyword: keyword.keyword,
      detail: null,
    }
  }

  return {
    sizeClass: 'à vérifier',
    rule: 'unknown',
    weightKg: null,
    dimsCm: null,
    matchedKeyword: null,
    detail: null,
  }
}
