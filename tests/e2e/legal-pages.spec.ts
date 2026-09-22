import { test, expect } from '@playwright/test'

const LEGAL_ROUTES = [
  '/mentions-legales',
  '/cgv',
  '/politique-confidentialite',
  '/politique-cookies',
  '/retractation',
  '/transparence-affiliation',
  '/guides',
  '/guides/exemple',
]

/**
 * The placeholder assertion is the build gate restated at the HTTP layer.
 * Phase 1B filled the last of the values it was failing on, so it is
 * green now, and a red result means exactly one thing: something
 * unfinished is reachable.
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
  for (const route of ['/mentions-legales', '/cgv', '/politique-confidentialite', '/retractation', '/transparence-affiliation']) {
    await page.goto(route)

    // Its own description, not the homepage's.
    const description = await page.locator('meta[name="description"]').getAttribute('content')
    expect(description, `${route} has no description`).toBeTruthy()
    expect(description).not.toContain('Surstocks et retours open-box à moitié prix, dont des')

    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href')
    expect(canonical, `${route} has no canonical`).toContain(route)

    const robots = await page.locator('meta[name="robots"]').getAttribute('content')
    if (robots) expect(robots).not.toContain('noindex')

    await expect(page.getByText(/En vigueur au|Mise[s]? à jour le|Dernière mise à jour le/)).toBeVisible()
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

  for (const label of ['Mentions légales', 'CGV', 'Confidentialité', 'Cookies', 'Transparence & affiliation', 'Rétractation']) {
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

/**
 * /politique-confidentialite is the page Phase 1 deliberately left out,
 * so these assert the three things that made leaving it out the right
 * call: it exists, it is reachable from everywhere, and it is a privacy
 * policy rather than the cookie table renamed.
 */
test('the privacy policy answers and says what it has to say', async ({ page }) => {
  const response = await page.goto('/politique-confidentialite')
  expect(response?.status()).toBe(200)

  const body = await page.locator('body').innerText()
  for (const required of [
    'Responsable du traitement',
    'AUTOWEB COMMERCE SAS',
    'SIREN 100 148 469',
    'Stripe',
    'Resend',
    'MongoDB Atlas',
    'Vercel',
    'Durées de conservation',
    'Data Privacy Framework',
    'CNIL',
    'portabilité',
  ]) {
    expect(body, `the privacy policy never mentions ${required}`).toContain(required)
  }
})

test('the privacy policy is linked from the footer and from the order form', async ({ page }) => {
  await page.goto('/cgv')
  await expect(
    page.locator('footer').getByRole('link', { name: 'Confidentialité', exact: true })
  ).toHaveAttribute('href', '/politique-confidentialite')

  // The CGV acceptance box lives on /cart: /checkout is the embedded
  // Stripe frame, and consent is given before it, not inside it.
  await page.goto('/cart')
  const link = page.getByRole('link', { name: 'politique de confidentialité' })
  await expect(link.or(page.locator('a[href="/politique-confidentialite"]')).first()).toBeAttached()
})

test('CGV article 9 carries the guarantee box and its Légifrance references', async ({ page }) => {
  await page.goto('/cgv')
  const body = await page.locator('body').innerText()

  expect(body).toContain(
    "Le consommateur dispose d'un délai de deux ans à compter de la délivrance du bien"
  )
  expect(body).toContain('300 000 euros')

  for (const id of ['LEGIARTI000044142587', 'LEGIARTI000044142730', 'LEGIARTI000006441924']) {
    await expect(page.locator(`a[href*="${id}"]`)).toHaveCount(1)
  }
})

test('CGV article 4 does not present the comparison as our own former price', async ({ page }) => {
  await page.goto('/cgv')
  const body = await page.locator('body').innerText()
  expect(body).toContain('TVA française au taux de 20 % incluse')
  expect(body).toContain('prix de vente constaté chez un autre distributeur')
  expect(body).toContain("Il ne s’agit pas d’une réduction par rapport à un prix antérieurement")
})
