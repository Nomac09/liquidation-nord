import { defineConfig } from 'vitest/config'
import { resolve } from 'node:path'

export default defineConfig({
  test: {
    // Unit tests only. Playwright owns tests/e2e and would otherwise be
    // collected here and fail on its own imports.
    include: ['tests/unit/**/*.test.ts'],
    environment: 'node',
  },
  resolve: {
    alias: { '@': resolve(__dirname, '.') },
  },
})
