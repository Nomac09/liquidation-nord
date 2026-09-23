import { test, expect } from '@playwright/test'

const GUIDE = '/guides/exemple'

/**
 * These are Amazon Associates operating-agreement requirements, not house
 * style. Breaking any of them can close the account, and a UI refactor is
 * exactly how a price or a cart button quietly reappears on a partner
 * card, so they are asserted rather than trusted.
 */
test.describe('affiliate cards', () => {
  test('the outbound link is sponsored, nofollow, and opens a new tab', async ({ page }) => {
    await page.goto(GUIDE)

    const cta = page.getByRole('link', { name: /Voir sur Amazon/ }).first()
    await expect(cta).toBeVisible()

    const rel = (await cta.getAttribute('rel')) || ''
    expect(rel).toContain('sponsored')
    expect(rel).toContain('nofollow')
    expect(rel).toContain('noopener')

    expect(await cta.getAttribute('target')).toBe('_blank')
    expect(await cta.getAttribute('href')).toContain('amazon.fr')
  })

  test('the card is badged, names the seller, and shows no price', async ({ page }) => {
    await page.goto(GUIDE)

    const card = page.getByTestId('affiliate-card').first()
    await expect(card.getByText('Lien partenaire').first()).toBeVisible()
    await expect(card.getByText(/Vendu par Amazon, pas par Souqify/)).toBeVisible()
    await expect(card.getByText(/Voir le prix actuel sur Amazon/)).toBeVisible()

    // No price, and nothing that could read as one of our own offers.
    const cardText = await card.innerText()
    expect(cardText, 'an affiliate card must not display a price').not.toMatch(/\d[\d\s,.]*\s*€/)
    expect(cardText).not.toContain('Ajouter au panier')
    expect(cardText).not.toContain('−50')
  })

  test('the disclosure sits above the first affiliate link', async ({ page }) => {
    await page.goto(GUIDE)

    const disclosure = page.getByText(/Cet article contient des liens partenaires/)
    await expect(disclosure).toBeVisible()

    const disclosureBox = await disclosure.boundingBox()
    const ctaBox = await page.getByRole('link', { name: /Voir sur Amazon/ }).first().boundingBox()

    expect(disclosureBox).not.toBeNull()
    expect(ctaBox).not.toBeNull()
    expect(
      disclosureBox!.y,
      'the disclosure must precede the first affiliate link, not follow it'
    ).toBeLessThan(ctaBox!.y)
  })

  test('the badge is announced to screen readers', async ({ page }) => {
    await page.goto(GUIDE)
    const cta = page.getByRole('link', { name: /Voir sur Amazon/ }).first()
    await expect(cta).toContainText('Lien partenaire, s’ouvre dans un nouvel onglet')
  })

  test('clicking records the click server side', async ({ page }) => {
    await page.goto(GUIDE)

    // Never actually leave for Amazon: the assertion is about the beacon
    // the click fires, and a real navigation would end the page that is
    // supposed to be sending it.
    await page.route('**://*.amazon.fr/**', (route) => route.abort())

    const tracked = page.waitForRequest(
      (req) => req.url().includes('/api/track/affiliate-click') && req.method() === 'POST'
    )

    const cta = page.getByRole('link', { name: /Voir sur Amazon/ }).first()
    await cta.evaluate((el) => el.removeAttribute('target'))
    await cta.click()

    const request = await tracked
    const payload = JSON.parse(request.postData() || '{}')
    expect(payload.affiliateId).toBe('amz-voile-ombrage-5x5')
    expect(payload.merchant).toBe('amazon')
    expect(payload.pageSlug).toBe('exemple')
    // No identifier of any kind is sent.
    expect(Object.keys(payload).sort()).toEqual(['affiliateId', 'merchant', 'pageSlug', 'position'])
  })
})

test('the draft sample guide is noindex and out of the hub', async ({ page }) => {
  await page.goto(GUIDE)
  const robots = await page.locator('meta[name="robots"]').getAttribute('content')
  expect(robots).toContain('noindex')

  await page.goto('/guides')
  await expect(page.getByRole('link', { name: /Ombrager une terrasse/ })).toHaveCount(0)

  const sitemap = await page.request.get('/sitemap.xml')
  expect(await sitemap.text()).not.toContain('/guides/exemple')
})

test('own-product cards are visibly ours, not partner cards', async ({ page }) => {
  await page.goto(GUIDE)
  await expect(page.getByText('Vendu et expédié par Souqify').first()).toBeVisible()
})
