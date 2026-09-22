import { describe, it, expect } from 'vitest'
import { buildOrderConfirmationHtml, type OrderForEmail } from '@/lib/email'

const ORDER: OrderForEmail = {
  orderId: 'SQ-TEST-0001',
  createdAt: new Date('2026-10-01T10:00:00.000Z'),
  items: [
    {
      name: 'Voile de parasol tissu oxford 3x4,5 m anthracite',
      price: 34.9,
      quantity: 1,
      returnNote: 'Retour possible en point relais, à vos frais (environ 29,99 €).',
    },
    {
      name: 'Tonnelle avec toit à persienne 3x4 m anthracite',
      price: 349.9,
      quantity: 1,
      returnNote:
        'Article volumineux : en cas de rétractation, retour à vos frais, coût estimé 129,99 €. ' +
        'Vous pouvez aussi le rapporter gratuitement à l’entrepôt de Bondues sur rendez-vous.',
    },
  ],
  shippingMethod: 'home',
  shippingCost: 129.99,
  shippingDetails: { line1: '1 rue de la Paix', postalCode: '59000', city: 'Lille' },
  customerEmail: 'acheteur@example.com',
  customerName: 'Camille Martin',
  cgvVersionDate: '1er octobre 2026',
  deliveryPromise:
    'Livraison à domicile à une date convenue avec vous par Cocolis, généralement sous 7 à 15 jours.',
  deliveryLatestDate: new Date('2026-10-16T00:00:00.000Z'),
}

describe('the order confirmation email', () => {
  const html = buildOrderConfirmationHtml(ORDER)

  it('states the TVA under the total', () => {
    expect(html).toContain('dont TVA 20 %')
    // 34,90 + 349,90 + 129,99 = 514,79 TTC. TVA = round(514,79 / 6) = 85,80.
    expect(html).toContain('514,79')
    expect(html).toContain('85,80')
  })

  it('shows no tax-exclusive figure anywhere', () => {
    // A blunt substring check on purpose: "Total HT", "Prix HT" and a
    // stray "HT" column header would all fail this, which is what we
    // want. A consumer never sees a price that is not the price paid.
    expect(html).not.toContain('HT')
  })

  it('repeats the delivery promise and the date it resolves to', () => {
    expect(html).toContain('date convenue avec vous par Cocolis')
    expect(html).toContain('16 octobre 2026')
    expect(html).toContain('Livré au plus tard le')
  })

  it('says "Prêt" rather than "Livré" for a collection', () => {
    const pickup = buildOrderConfirmationHtml({
      ...ORDER,
      shippingMethod: 'pickup',
      shippingCost: 0,
      deliveryPromise: 'Disponible au retrait sous 2 jours ouvrés, sur rendez-vous.',
    })
    expect(pickup).toContain('Prêt au plus tard le')
    expect(pickup).not.toContain('Livré au plus tard le')
  })

  it('carries the return cost for every article', () => {
    expect(html).toContain('environ 29,99 €')
    expect(html).toContain('coût estimé 129,99 €')
  })

  it('names the CGV version the buyer actually accepted', () => {
    expect(html).toContain('en vigueur au 1er octobre 2026')
  })

  it('links the CGV without a version when none was pinned', () => {
    const unpinned = buildOrderConfirmationHtml({ ...ORDER, cgvVersionDate: undefined })
    expect(unpinned).not.toContain('en vigueur au')
    expect(unpinned).toContain('/cgv')
  })

  it('escapes what a product name could smuggle into the markup', () => {
    const nasty = buildOrderConfirmationHtml({
      ...ORDER,
      items: [{ name: '<script>alert(1)</script>', price: 10, quantity: 1 }],
    })
    expect(nasty).not.toContain('<script>alert(1)</script>')
    expect(nasty).toContain('&lt;script&gt;')
  })
})
