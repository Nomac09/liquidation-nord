import { test, expect } from '@playwright/test'

/**
 * The CGV gate at checkout.
 *
 * Deliberately stops at the point where Stripe's iframe takes over. The
 * card-entry and webhook half of the flow needs `stripe listen` forwarding
 * to this machine and a seeded sellable product, so it lives in the
 * skipped test at the bottom with the command to run it rather than
 * pretending to pass here.
 */
test.describe('checkout requires the CGV', () => {
  // The cart is seeded directly rather than clicked together from the
  // grid. Every piece is a single unit, so whichever one the UI path
  // picked could be sold between two runs and the suite would fail for a
  // reason that has nothing to do with the CGV gate. What is under test
  // here is client-side: the checkbox, the button state and the server's
  // refusal, none of which care whether the product is real.
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem(
        'cart-storage',
        JSON.stringify({
          state: {
            items: [
              {
                productId: '000000000000000000000000',
                name: 'Pièce de test',
                price: 49.99,
                quantity: 1,
                photo: '',
                weight: 5,
              },
            ],
          },
          version: 0,
        })
      )
    })
    await page.goto('/cart')
  })

  async function fillCustomer(page: import('@playwright/test').Page) {
    await page.getByLabel(/Nom/i).first().fill('Jeanne Dupont')
    await page.getByLabel(/Téléphone/i).first().fill('0601020304')
    await page.getByLabel(/Adresse/i).first().fill('12 rue des Lilas')
    await page.getByLabel(/postal/i).first().fill('59000')
    await page.getByLabel(/Ville/i).first().fill('Lille')
  }

  test('the button is disabled until the box is ticked', async ({ page }) => {
    await fillCustomer(page)

    const submit = page.getByRole('button', { name: /Commander avec obligation de paiement/ })
    await expect(submit).toBeVisible()
    await expect(submit, 'payment must not be reachable without accepting the CGV').toBeDisabled()

    const checkbox = page.getByRole('checkbox')
    await expect(checkbox, 'the CGV box must never be pre-ticked').not.toBeChecked()

    await checkbox.check()
    await expect(submit).toBeEnabled()
  })

  test('the CGV box links to the terms', async ({ page }) => {
    const link = page.getByRole('link', { name: /conditions générales de vente/i })
    await expect(link).toBeVisible()
    expect(await link.getAttribute('href')).toBe('/cgv')
  })

  test('the server refuses a session without acceptance', async ({ page, request }) => {
    const response = await request.post('/api/checkout/create-session', {
      data: {
        items: [{ productId: '000000000000000000000000' }],
        shippingMethod: 'pickup',
        customer: {
          name: 'Jeanne Dupont',
          phone: '0601020304',
          address: { line1: '12 rue des Lilas', postalCode: '59000', city: 'Lille' },
        },
        // cgvAccepted omitted on purpose: a client-only checkbox proves nothing.
      },
    })

    expect(response.status()).toBe(400)
    expect((await response.json()).error).toBe('cgv-not-accepted')
  })

  test('the cart states prices are TTC and never mentions 293 B', async ({ page }) => {
    const body = await page.locator('body').innerText()
    expect(body).toContain('Prix TTC, TVA 20 % incluse')
    expect(body).not.toContain('293 B')
    expect(body).not.toContain('TVA non applicable')
  })
})

/**
 * Full payment through Stripe test mode.
 *
 * Needs, in another terminal:
 *   stripe listen --forward-to localhost:3100/api/webhooks/stripe
 * and STRIPE_WEBHOOK_SECRET set to the whsec_ it prints. Without the
 * forward, the order is created but never marked paid, because the
 * webhook is the only thing that does that, so the assertion below would
 * fail for a reason that has nothing to do with checkout.
 *
 * Run with: E2E_STRIPE=1 npx playwright test checkout
 */
test.describe('full Stripe test-mode payment', () => {
  test.skip(!process.env.E2E_STRIPE, 'needs `stripe listen` forwarding, see the comment above')

  test('pays with 4242 and lands on the confirmation', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: /Ajouter/ }).first().click()
    await page.goto('/cart')
    await page.getByLabel(/Nom/i).first().fill('Jeanne Dupont')
    await page.getByLabel(/Téléphone/i).first().fill('0601020304')
    await page.getByLabel(/Adresse/i).first().fill('12 rue des Lilas')
    await page.getByLabel(/postal/i).first().fill('59000')
    await page.getByLabel(/Ville/i).first().fill('Lille')
    await page.getByRole('checkbox').check()
    await page.getByRole('button', { name: /Commander avec obligation de paiement/ }).click()

    await page.waitForURL('**/checkout')
    const stripeFrame = page.frameLocator('iframe[name^="__privateStripeFrame"]').first()
    await stripeFrame.getByPlaceholder('1234 1234 1234 1234').fill('4242424242424242')
    await stripeFrame.getByPlaceholder('MM / YY').fill('12 / 34')
    await stripeFrame.getByPlaceholder('CVC').fill('123')
    await stripeFrame.getByRole('button', { name: /Pay|Payer/ }).click()

    await page.waitForURL('**/success**', { timeout: 60_000 })
    await expect(page.getByText(/Merci pour votre commande/)).toBeVisible()
  })
})
