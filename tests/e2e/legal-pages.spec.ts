import { test, expect } from '@playwright/test'

const LEGAL_ROUTES = [
  '/mentions-legales',
  '/cgv',
  '/retractation',
  '/transparence-affiliation',
  '/guides',
  '/guides/exemple',
]

/**
 * The placeholder assertion is the build gate restated at the HTTP layer.
 * It fails today, on purpose: lib/company.ts still holds twelve unfilled
 * values (docs/PHASE1_AUDIT.md §11) and these pages render several of
 * them. It goes green the moment those are supplied, and a red result
 * here means exactly one thing, which is that something unfinished is
 * reachable.
 */
for (const route of LEGAL_ROUTES) {
  test(`${route} renders and carries nothing unfinished`, async ({ page }) => {
    const response = await page.goto(route)
    expect(response?.status(), `${route} should answer 200`).toBe(200)

    const body = await page.locator('body').innerText()

    expect(body, `${route} still shows an unfilled placeholder`).not.toContain('À COMPLÉTER')
    expect(body, `${route} still claims the 293 B franchise en base`).not.toContain('293 B')
    expect(body, `${route} still claims TVA non applicable`).not.toContain('TVA non applicable')
    expect(body, `${route} still carries the draft banner`).not.toContain('Brouillon')
  })
}

test('every legal page states a version date and is indexable', async ({ page }) => {
  for (const route of ['/mentions-legales', '/cgv', '/retractation', '/transparence-affiliation']) {
    await page.goto(route)

    // Its own description, not the homepage's.
    const description = await page.locator('meta[name="description"]').getAttribute('content')
    expect(description, `${route} has no description`).toBeTruthy()
    expect(description).not.toContain('Surstocks et retours open-box à moitié prix, dont des')

    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href')
    expect(canonical, `${route} has no canonical`).toContain(route)

    const robots = await page.locator('meta[name="robots"]').getAttribute('content')
    if (robots) expect(robots).not.toContain('noindex')

    await expect(page.getByText(/En vigueur au|Mise[s]? à jour le/)).toBeVisible()
  }
})

test('the footer carries the statutory identity block', async ({ page }) => {
  await page.goto('/cgv')
  const footer = page.locator('footer')

  await expect(footer).toContainText('AUTOWEB COMMERCE SAS')
  await expect(footer).toContainText('SIREN 100 148 469')
  await expect(footer).toContainText('FR44100148469')
  await expect(footer).toContainText('Prix TTC, TVA 20 % incluse')
  await expect(footer).toContainText(/pas affilié à vidaXL/)

  for (const label of ['Mentions légales', 'CGV', 'Cookies', 'Transparence & affiliation', 'Rétractation']) {
    await expect(footer.getByRole('link', { name: label, exact: true })).toBeVisible()
  }
  await expect(footer.getByRole('button', { name: 'Gérer mes cookies' })).toBeVisible()
})

test('the withdrawal page offers a prefilled email', async ({ page }) => {
  await page.goto('/retractation')
  const mailto = page.getByRole('link', { name: /email de rétractation prérempli/i })
  await expect(mailto).toBeVisible()

  const href = await mailto.getAttribute('href')
  expect(href).toContain('mailto:contact@souqify.fr')
  expect(href).toContain('subject=')
  expect(href).toContain('body=')
})
