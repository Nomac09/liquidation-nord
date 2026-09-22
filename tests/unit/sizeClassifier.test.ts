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

  it('rule (b): falls back to parsing the name when supplier data is absent or zero', () => {
    const result = classifyProductSize({
      name: 'vidaXL Toile de rechange pour auvent Beige 380 x 295 cm',
      weight: 0,
      dimensions: '',
    })
    expect(result.rule).toBe('name-parsed')
    expect(result.dimsCm).toEqual([380, 295])
    expect(result.sizeClass).toBe('XL')
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

  it('falls back to name-parsed dimensions when supplier weight has no package dimensions, for a non-foldable item', () => {
    const result = classifyProductSize({
      name: 'vidaXL Lit surélevé de jardin gris 119,5x82,5x78 cm bois',
      weight: 12,
      dimensions: '',
    })
    expect(result.rule).toBe('supplier-data')
    expect(result.dimsCm).toEqual([119.5, 82.5, 78])
    // Longest side 119.5 cm and sum 280 cm both push this to XL even
    // though 12 kg alone would only be M.
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
