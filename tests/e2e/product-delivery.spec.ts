import { test, expect, type APIRequestContext } from '@playwright/test'

/**
 * The delivery promise and the return cost, on a real product page.
 *
 * Both are weight-dependent, and the two cases that matter are opposite
 * ends of the same rule: an article a parcel relay can take, and one it
 * cannot. The slugs are found at run time rather than hardcoded, because
 * every article here is a single unit and the one you pinned last month
 * is the one that sold.
 */

interface Candidate {
  slug: string
  weight: number
  status?: string
}

async function findBySlug(
  request: APIRequestContext,
  pick: (weight: number) => boolean
): Promise<Candidate | null> {
  // 711 articles at the API's 100 cap; five pages is plenty to find one
  // of each and keeps a failure fast rather than exhaustive.
  for (let page = 0; page < 5; page += 1) {
    const response = await request.get(`/api/products?limit=100&skip=${page * 100}`)
    if (!response.ok()) return null
    const { items } = (await response.json()) as { items: Candidate[] }
    if (!items?.length) return null
    const hit = items.find((i) => i.status === 'sellable' && pick(i.weight || 0))
    if (hit) return hit
  }
  return null
}

test('a relay-eligible article states its relay delay and its relay return cost', async ({
  page,
  request,
}) => {
  const product = await findBySlug(request, (w) => w > 0 && w <= 30)
  test.skip(!product, 'no sellable article under 30 kg in the catalogue')

  await page.goto(`/product/${product!.slug}`)
  const section = page.getByRole('region', { name: 'Livraison et retrait' })
  await expect(section).toBeVisible()

  // Preparation (1-3 ouvrés) plus transit (3-6 ouvrés).
  await expect(section).toContainText('Livraison en point relais sous 4 à 9 jours ouvrés')
  await expect(section).toContainText('Disponible au retrait sous 2 jours ouvrés')
  await expect(section).toContainText('date convenue avec vous par Cocolis')

  await expect(section).toContainText('Retour possible en point relais, à vos frais (environ')
  await expect(section).toContainText('Retour gratuit si vous le rapportez à l’entrepôt.')
  await expect(section).not.toContainText('Article volumineux')
})

test('a Cocolis-only article says the relay is out and quotes the bulky return', async ({
  page,
  request,
}) => {
  const product = await findBySlug(request, (w) => w > 30)
  test.skip(!product, 'no sellable article over 30 kg in the catalogue')

  await page.goto(`/product/${product!.slug}`)
  const section = page.getByRole('region', { name: 'Livraison et retrait' })
  await expect(section).toBeVisible()

  // The mode is shown as unavailable, with a reason, rather than hidden:
  // "no relay option" and "a relay option I missed" look the same to
  // someone scanning a page.
  await expect(section).toContainText('Article trop lourd pour un point relais')
  await expect(section).not.toContainText('Livraison en point relais sous')
  await expect(section).toContainText('date convenue avec vous par Cocolis')

  await expect(section).toContainText('Article volumineux')
  await expect(section).toContainText('coût estimé')
  await expect(section).toContainText('rapporter gratuitement à l’entrepôt de Bondues')
})

test('no price on a product page is presented as a former price of ours', async ({
  page,
  request,
}) => {
  const product = await findBySlug(request, () => true)
  test.skip(!product, 'no sellable article in the catalogue')

  await page.goto(`/product/${product!.slug}`)

  // Nothing struck through anywhere near the price. A struck-through
  // figure beside a percentage reads as "it used to cost this here",
  // which art. L112-1-1 reserves for a real reduction.
  await expect(page.locator('main s, s')).toHaveCount(0)

  const body = await page.locator('body').innerText()
  expect(body).not.toContain('au lieu de')

  // If a comparison shows at all, it names the retailer and the day.
  const badge = page.getByText(/vs vidaXL/)
  if (await badge.count()) {
    expect(body).toMatch(/Prix constaté sur vidaXL\.fr le \d{2}\/\d{2}\/\d{4}/)
  }
})
