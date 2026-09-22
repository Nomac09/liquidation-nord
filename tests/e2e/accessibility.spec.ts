import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

/**
 * axe-core rather than a Lighthouse run.
 *
 * Lighthouse's accessibility score is a weighted average of axe checks,
 * so "score >= 95" is a blurrier version of what is asserted here: zero
 * violations at the levels that matter. A score also lets a real
 * violation hide behind a high average, which is the opposite of useful.
 * To reproduce the Lighthouse number itself:
 *
 *   npx lighthouse http://127.0.0.1:3100/guides/exemple \
 *     --only-categories=accessibility --chrome-flags="--headless"
 */
const PAGES = [
  '/guides/exemple',
  '/guides',
  '/cgv',
  '/mentions-legales',
  '/retractation',
  '/transparence-affiliation',
]

for (const route of PAGES) {
  test(`${route} has no accessibility violations`, async ({ page }) => {
    await page.goto(route)

    const { violations } = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()

    const summary = violations.map(
      (v) => `${v.id} (${v.impact}): ${v.help} [${v.nodes.length} node(s)]\n    ${v.nodes[0]?.html?.slice(0, 160)}`
    )
    expect(summary, `${route} has accessibility violations`).toEqual([])
  })
}

test('colour contrast passes AA on a guide', async ({ page }) => {
  await page.goto('/guides/exemple')

  const { violations } = await new AxeBuilder({ page })
    .withRules(['color-contrast'])
    .analyze()

  expect(
    violations.flatMap((v) => v.nodes.map((n) => n.html.slice(0, 160))),
    'text must meet WCAG AA contrast'
  ).toEqual([])
})

/**
 * Product cards carry images that arrive after first paint. Without a
 * reserved box they push the article body down as they load, which is
 * both a Core Web Vitals problem and the reason a reader loses their
 * place mid-sentence.
 */
test('the product strip causes no cumulative layout shift', async ({ page }) => {
  await page.goto('/guides/exemple', { waitUntil: 'load' })

  const cls = await page.evaluate(
    () =>
      new Promise<number>((resolve) => {
        let total = 0
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries() as (PerformanceEntry & {
            value: number
            hadRecentInput: boolean
          })[]) {
            if (!entry.hadRecentInput) total += entry.value
          }
        })
        observer.observe({ type: 'layout-shift', buffered: true })

        // Scroll the strip into view so its images actually load, then
        // give them a beat to arrive before reading the total.
        window.scrollTo(0, document.body.scrollHeight)
        setTimeout(() => {
          observer.disconnect()
          resolve(total)
        }, 3000)
      })
  )

  // 0.1 is the "good" threshold for Core Web Vitals.
  expect(cls, `cumulative layout shift was ${cls}`).toBeLessThan(0.1)
})
