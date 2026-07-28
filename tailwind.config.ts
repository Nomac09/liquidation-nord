import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // "Quiet premium" identity — the sitewide palette. CSS-variable-
        // backed so light/dark follow prefers-color-scheme automatically
        // (see globals.css). Named after real finishes in the catalog
        // (Anthracite ink, Corten/verdigris patina), not an imported
        // palette. The old encre/bleu/orange/beton/blanc/gris/ligne tokens
        // are retired — every component now uses these instead.
        stone: 'var(--stone)',
        surface: 'var(--surface)',
        paper: 'var(--paper)',
        ink: 'var(--ink)',
        dust: 'var(--dust)',
        hairline: { DEFAULT: 'var(--hairline)', strong: 'var(--hairline-strong)' },
        verdigris: { DEFAULT: 'var(--verdigris)', deep: 'var(--verdigris-deep)' },
        // Semantic only — form errors, "unavailable at checkout" notices.
        // Deliberately not the brand accent; a separate, muted rust so it
        // never gets mistaken for a price/discount treatment.
        alert: { DEFAULT: 'var(--alert)', pale: 'var(--alert-pale)' },
      },
      fontFamily: {
        // Ibarra Real Nova (editorial serif) + Karla (quiet humanist sans),
        // sitewide. Kept under the same `display`/`sans` names the whole
        // codebase already uses — no component had to change its
        // className, only what these two names point to changed.
        display: ['var(--font-serif)', 'Georgia', 'serif'],
        sans: ['var(--font-karla)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
        // Aliases to the same fonts, kept because the first migrated pages
        // (product page, homepage hero) already reference them by these
        // names — harmless duplication, not a second type system.
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
        karla: ['var(--font-karla)', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        micro: ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0.08em' }],
      },
      boxShadow: {
        carte: '0 1px 2px rgba(34, 34, 31, 0.06), 0 8px 24px -12px rgba(34, 34, 31, 0.12)',
        levee: '0 2px 4px rgba(34, 34, 31, 0.08), 0 16px 40px -16px rgba(34, 34, 31, 0.22)',
      },
    },
  },
  plugins: [],
}
export default config
