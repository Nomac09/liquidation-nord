import { describe, it, expect } from 'vitest'
import { buildCreateDoc, buildUpdatePatch, initialSalePrice, parseProductRow } from '@/lib/xlsxImport'

describe('parseProductRow', () => {
  it('reads the standard columns', () => {
    const row = parseProductRow({
      EAN: '1234567890123',
      Name: 'Table de jardin',
      Category: 'Jardin',
      RRP: '120,00',
      Quantity: '3',
    })
    expect(row).toEqual({
      ean: '1234567890123',
      sku: '',
      name: 'Table de jardin',
      category: 'Jardin',
      rrp: 120,
      quantity: 3,
      weight: null,
      photos: null,
      condition: null,
      dimensions: null,
    })
  })

  it('rejects a row with no name or EAN', () => {
    expect(parseProductRow({ Name: '', EAN: '123' })).toBeNull()
    expect(parseProductRow({ Name: 'Table', EAN: '' })).toBeNull()
    expect(parseProductRow({ Name: 'Table', EAN: '0' })).toBeNull()
  })

  it('unpacks scientific-notation EANs Excel introduces on its own', () => {
    const row = parseProductRow({ Name: 'Chaise', EAN: '1.23457E+12', RRP: '10' })
    expect(row?.ean).toBe('1234570000000')
  })

  it('only picks up weight, photos, condition and dimensions when present and real', () => {
    const withData = parseProductRow({
      Name: 'Table',
      EAN: '123',
      RRP: '10',
      Weight: '12,5',
      Photos: 'https://a.jpg, https://b.jpg',
      Condition: 'Open-box',
      Dimensions: '80x40x35 cm',
    })
    expect(withData).toMatchObject({
      weight: 12.5,
      photos: ['https://a.jpg', 'https://b.jpg'],
      condition: 'Open-box',
      dimensions: '80x40x35 cm',
    })

    const withoutData = parseProductRow({ Name: 'Table', EAN: '123', RRP: '10', Weight: '0' })
    expect(withoutData).toMatchObject({ weight: null, photos: null, condition: null, dimensions: null })
  })
})

describe('buildUpdatePatch', () => {
  it('never zeroes out weight, photos, condition or dimensions the sheet does not carry', () => {
    const row = parseProductRow({
      EAN: '1234567890123',
      Name: 'Table de jardin',
      Category: 'Jardin',
      RRP: '120,00',
      Quantity: '3',
    })!
    const patch = buildUpdatePatch(row, 'table-de-jardin-1234567890123')

    expect(patch).not.toHaveProperty('weight')
    expect(patch).not.toHaveProperty('photos')
    expect(patch).not.toHaveProperty('condition')
    expect(patch).not.toHaveProperty('dimensions')
  })

  it('never touches pricing fields on an existing product', () => {
    const row = parseProductRow({ EAN: '123', Name: 'Table', RRP: '600' })!
    const patch = buildUpdatePatch(row, 'table-123')

    expect(patch).not.toHaveProperty('salePrice')
    expect(patch).not.toHaveProperty('discountPercent')
    expect(patch).not.toHaveProperty('comparePrice')
    expect(patch).not.toHaveProperty('comparePriceSource')
    expect(patch).not.toHaveProperty('comparePriceCheckedAt')
  })

  it('does carry weight, photos, condition and dimensions when the sheet supplies them', () => {
    const row = parseProductRow({
      EAN: '123',
      Name: 'Table',
      RRP: '10',
      Weight: '8',
      Photos: 'https://a.jpg',
      Condition: 'Neuf',
      Dimensions: '10x10x10 cm',
    })!
    const patch = buildUpdatePatch(row, 'table-123')

    expect(patch).toMatchObject({
      weight: 8,
      photos: ['https://a.jpg'],
      condition: 'Neuf',
      dimensions: '10x10x10 cm',
    })
  })
})

describe('buildCreateDoc', () => {
  it('gives a brand-new product a starting price from the grid, and empty defaults otherwise', () => {
    const row = parseProductRow({ EAN: '123', Name: 'Table', RRP: '100' })!
    const doc = buildCreateDoc(row, 'table-123')

    expect(doc.salePrice).toBe(initialSalePrice(100))
    expect(doc.weight).toBe(0)
    expect(doc.photos).toEqual([])
    expect(doc.condition).toBe('')
  })

  it('uses the 40% bracket above 500€ and 50% at or under it', () => {
    expect(initialSalePrice(501)).toBe(Math.round(501 * 0.4))
    expect(initialSalePrice(500)).toBe(Math.round(500 * 0.5))
  })
})

describe('re-import scenario (PHASE1B_REPORT §3.5)', () => {
  it('keeps an existing product\'s weight and photos on a second import from a sheet with no such columns', () => {
    // Simulates the DB document as it is *before* the re-import: filled in
    // by hand after the first import already ran.
    const existing = {
      ean: '1234567890123',
      weight: 12.5,
      photos: ['https://cdn.example.com/a.jpg', 'https://cdn.example.com/b.jpg'],
      condition: 'Open-box, complet',
      salePrice: 59.9,
      discountPercent: 40,
      comparePrice: 99,
    }

    // The sheet only ever carries these columns.
    const row = parseProductRow({
      EAN: existing.ean,
      Name: 'Table de jardin',
      Category: 'Jardin',
      RRP: '120,00',
      Quantity: '2',
    })!
    const patch = buildUpdatePatch(row, 'table-de-jardin-1234567890123')

    // Applying the patch on top of `existing` must leave these untouched.
    const after = { ...existing, ...patch }
    expect(after.weight).toBe(existing.weight)
    expect(after.photos).toEqual(existing.photos)
    expect(after.condition).toBe(existing.condition)
    expect(after.salePrice).toBe(existing.salePrice)
    expect(after.discountPercent).toBe(existing.discountPercent)
    expect(after.comparePrice).toBe(existing.comparePrice)
  })
})
