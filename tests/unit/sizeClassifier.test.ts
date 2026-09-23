import { describe, it, expect } from 'vitest'
import {
  classifyByKeyword,
  classifyFromMeasurements,
  classifyProductSize,
  parseDimensionsCm,
  parseWeightKg,
} from '@/lib/sizeClassifier'

describe('parseDimensionsCm', () => {
  it('parses a two-number pattern', () => {
    expect(parseDimensionsCm('vidaXL Toile 450x300 cm')).toEqual([450, 300])
  })
  it('parses a three-number pattern with comma decimals and spaces', () => {
    expect(parseDimensionsCm('Étagère 60 x 50,5 x 8 cm blanche')).toEqual([60, 50.5, 8])
  })
  it('returns null when there is nothing to parse', () => {
    expect(parseDimensionsCm('Coussin gris')).toBeNull()
  })
})

describe('parseWeightKg', () => {
  it('parses a weight in kg', () => {
    expect(parseWeightKg('Remorque de vélo noir et jaune 45 kg fer')).toBe(45)
  })
  it('returns null with no weight', () => {
    expect(parseWeightKg('Coussin gris')).toBeNull()
  })
})

describe('classifyFromMeasurements', () => {
  it('classifies a small light item as S', () => {
    expect(classifyFromMeasurements(1, [30, 20, 10])).toBe('S')
  })
  it('bumps a long light item up because of its longest dimension', () => {
    // 2 kg alone would be S, but 200 cm long cannot be relay-sized.
    expect(classifyFromMeasurements(2, [200, 10, 10])).toBe('XL')
  })
  it('forces XL when the summed dimensions exceed the relay ceiling', () => {
    expect(classifyFromMeasurements(3, [100, 100, 100])).toBe('XL')
  })
  it('classifies from weight alone up to the relay ceiling as L', () => {
    expect(classifyFromMeasurements(28, null)).toBe('L')
  })
  it('classifies over the relay weight ceiling as XL', () => {
    expect(classifyFromMeasurements(45, null)).toBe('XL')
  })
})

describe('classifyByKeyword', () => {
  it('matches a simple keyword', () => {
    expect(classifyByKeyword('vidaXL Coussin de sol gris')).toEqual({ sizeClass: 'S', keyword: 'coussin' })
  })
  it('picks the largest class when several keywords match', () => {
    expect(classifyByKeyword('vidaXL Chaise de salon de jardin')?.sizeClass).toBe('XL')
  })
  it('returns null with no keyword match', () => {
    expect(classifyByKeyword('vidaXL Gadget mystère')).toBeNull()
  })
})

describe('classifyProductSize', () => {
  it('rule (a): uses supplier weight and dimensions when present', () => {
    const result = classifyProductSize({ name: 'Table de jardin', weight: 12, dimensions: '70x40x35 cm' })
    expect(result.rule).toBe('supplier-data')
    expect(result.sizeClass).toBe('M')
  })

  it('rule (a): the summed relay ceiling can still push supplier data to XL', () => {
    const result = classifyProductSize({ name: 'Table de jardin', weight: 12, dimensions: '80x40x35 cm' })
    expect(result.rule).toBe('supplier-data')
    expect(result.sizeClass).toBe('XL')
  })

  it('rule (b/c): with no weight at all, a foldable item with no keyword floor falls through to the keyword dictionary', () => {
    const result = classifyProductSize({
      name: 'vidaXL Toile de rechange pour auvent Beige 380 x 295 cm',
      weight: 0,
      dimensions: '',
    })
    // "toile" is foldable but has no floor of its own, so with zero weight
    // there's nothing to classify from there; "auvent" (L) in the keyword
    // dictionary picks it up instead. The unfolded 380x295 is never used.
    expect(result.rule).toBe('keyword')
    expect(result.matchedKeyword).toBe('auvent')
    expect(result.dimsCm).toBeNull()
    expect(result.sizeClass).toBe('L')
  })

  it('rule (c): falls back to the keyword dictionary when nothing is measurable', () => {
    const result = classifyProductSize({ name: 'vidaXL Coussin de canapé gris décoratif sans mesure' })
    expect(result.rule).toBe('keyword')
    // "canapé" (XL) beats "coussin" (S) — the more conservative match wins.
    expect(result.sizeClass).toBe('XL')
  })

  it('rule (d): "à vérifier" when nothing matches at all', () => {
    const result = classifyProductSize({ name: 'vidaXL Article générique 12345' })
    expect(result.rule).toBe('unknown')
    expect(result.sizeClass).toBe('à vérifier')
  })

  it('weight alone decides flat-pack furniture — name dimensions describe the assembled piece, not the box', () => {
    const result = classifyProductSize({
      name: 'vidaXL Lit surélevé de jardin gris 119,5x82,5x78 cm bois',
      weight: 12,
      dimensions: '',
    })
    expect(result.rule).toBe('supplier-data')
    expect(result.dimsCm).toBeNull()
    // 12 kg alone is M; the assembled 119.5x82.5x78 cm bed frame is not
    // the size of the flat-pack box it actually ships in.
    expect(result.sizeClass).toBe('M')
  })

  it('trusts name dimensions for the rigid-near-real-size allowlist (e.g. a dôme de piscine)', () => {
    const result = classifyProductSize({ name: 'vidaXL Dôme de piscine 559x275 cm', weight: 41.85, dimensions: '' })
    expect(result.rule).toBe('supplier-data')
    expect(result.dimsCm).toEqual([559, 275])
    expect(result.sizeClass).toBe('XL')
  })

  it('excludes "pied de parasol" from the parasol allowlist entry', () => {
    const result = classifyProductSize({
      name: 'vidaXL Pied de parasol Noir 40x40x40 cm Béton',
      weight: 5,
      dimensions: '',
    })
    expect(result.dimsCm).toBeNull()
    // 5 kg alone is S; the 40x40x40 cm base is not used since it's excluded.
    expect(result.sizeClass).toBe('S')
  })

  it('uses name dimensions for a real parasol (not a base)', () => {
    const result = classifyProductSize({
      name: 'vidaXL Parasol rectangulaire avec mât 200x300 cm',
      weight: 8,
      dimensions: '',
    })
    expect(result.dimsCm).toEqual([200, 300])
    expect(result.sizeClass).toBe('XL')
  })

  it('a manual override always wins', () => {
    const result = classifyProductSize({
      name: 'vidaXL Coussin de sol gris',
      weight: 1,
      sizeClassOverride: 'XL',
    })
    expect(result.rule).toBe('override')
    expect(result.sizeClass).toBe('XL')
  })

  it('newly added foldable keywords (rideau, moustiquaire...) no longer use their unfolded name dimensions', () => {
    const result = classifyProductSize({
      name: 'vidaXL Rideaux occultants avec crochets 2 pcs Beige 140x245 cm',
      weight: 0.72,
      dimensions: '',
    })
    expect(result.dimsCm).toBeNull()
    expect(result.sizeClass).toBe('S')
  })

  it('newly added foldable keywords (coussin, galette, assise, dossier, taie, plaid) are checked before the rigid allowlist', () => {
    const result = classifyProductSize({
      name: 'vidaXL Coussin de canapé palette beige 70x70x12 cm',
      weight: 1.8,
      dimensions: '',
    })
    // "coussin" is foldable and matches first — "canapé" (rigid) is never
    // even reached, so the 70x70x12 cm cushion dimensions are ignored.
    expect(result.dimsCm).toBeNull()
    expect(result.sizeClass).toBe('S')
  })

  it('does not treat an accessory reference ("housse de parasol") as the rigid item itself', () => {
    const result = classifyProductSize({
      name: 'vidaXL Housse de parasol Noir 200 cm Oxford',
      weight: 0.4,
      dimensions: '',
    })
    // "housse" is foldable and wins outright; even without that, "parasol"
    // here is an accessory reference ("de parasol"), not the head noun.
    expect(result.dimsCm).toBeNull()
    expect(result.sizeClass).toBe('S')
  })

  it('still matches a rigid keyword as the head noun even when a different rigid keyword appears elsewhere only as an accessory reference', () => {
    const result = classifyProductSize({
      name: 'vidaXL Canapé de jardin avec pied de parasol assorti 200x90x85 cm',
      weight: 20,
      dimensions: '',
    })
    // "canapé" leads the name — a real head-noun match — while "parasol"
    // only ever appears as "pied de parasol", an accessory reference that
    // must not count on its own. The dimensions are still used, decided
    // by "canapé".
    expect(result.dimsCm).toEqual([200, 90, 85])
    expect(result.sizeClass).toBe('XL')
  })

  it('ignores name dimensions for a foldable/fabric item — they describe the unfolded product, not the parcel', () => {
    const result = classifyProductSize({
      name: 'vidaXL Toile de rechange pour auvent Beige 380 x 295 cm',
      weight: 2.5,
      dimensions: '',
    })
    expect(result.rule).toBe('supplier-data')
    expect(result.dimsCm).toBeNull()
    // 2.5 kg alone is S, and "toile" carries no keyword floor.
    expect(result.sizeClass).toBe('S')
  })

  it('applies the "tapis" keyword floor of M even when the weight alone would be S', () => {
    const result = classifyProductSize({
      name: 'vidaXL Tapis en peluche en forme de léopard 139 cm Marron',
      weight: 1,
      dimensions: '',
    })
    expect(result.sizeClass).toBe('M')
    expect(result.matchedKeyword).toBe('tapis')
  })

  it('applies the "tente de réception" keyword floor of L even for a light item', () => {
    const result = classifyProductSize({
      name: 'vidaXL Tente de réception pliable avec parois Noir 3x6 m',
      weight: 3,
      dimensions: '',
    })
    expect(result.sizeClass).toBe('L')
    expect(result.matchedKeyword).toBe('tente de réception')
  })
})
