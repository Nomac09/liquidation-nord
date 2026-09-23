import { defineConfig, devices } from '@playwright/test'

const PORT = Number(process.env.E2E_PORT || 3100)
const BASE_URL = `http://127.0.0.1:${PORT}`

/**
 * Runs against a production build, not `next dev`.
 *
 * Half of what these tests check only exists in the built output:
 * prerendered legal pages, the generated OG image, the draft guide's
 * noindex. Dev-mode overlays and on-demand compilation also make the
 * first assertion on each route flaky for no useful reason.
 *
 * The escape hatch is deliberately NOT set any more. Phase 1B filled the
 * last of the outstanding values, so the suite runs with the build gate
 * fully armed, exactly as a production build does — which is the only
 * configuration in which the "nothing unfinished is reachable" assertions
 * mean anything.
 *
 * NEXT_PUBLIC_CGV_VERSION_DATE is supplied here because it is an
 * environment value rather than a source value: on Vercel it is set once,
 * at the first production deploy. The date below is a test fixture and
 * has no relationship to the real one.
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command:
      `NEXT_PUBLIC_CGV_VERSION_DATE="1er octobre 2026" npx next build && ` +
      `NEXT_PUBLIC_CGV_VERSION_DATE="1er octobre 2026" npx next start -p ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
})
