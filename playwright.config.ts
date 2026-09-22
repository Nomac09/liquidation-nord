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
 * LEGAL_ALLOW_INCOMPLETE is set so the suite can run while the values in
 * docs/PHASE1_AUDIT.md §11 are outstanding. The placeholder assertions
 * below will fail until they are filled, which is the intended signal,
 * not a broken test.
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
    command: `LEGAL_ALLOW_INCOMPLETE=1 npx next build && npx next start -p ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
})
