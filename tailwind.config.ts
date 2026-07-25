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
        encre: '#191C24',
        bleu: { DEFAULT: '#24408E', deep: '#1B3170', pale: '#E8EDF8' },
        orange: { DEFAULT: '#FF4D1F', deep: '#E03A0E', pale: '#FFEDE7' },
        beton: '#ECEBE6',
        blanc: '#FDFDFB',
        gris: '#62687A',
        ligne: '#D9D8D0',

        // "Quiet premium" identity — additive tokens for pages migrated to
        // the new design system. CSS-variable-backed so light/dark follow
        // prefers-color-scheme automatically (see globals.css). Named after
        // real finishes in the catalog (Anthracite ink, Corten/verdigris
        // patina), not an imported palette.
        stone: 'var(--stone)',
        surface: 'var(--surface)',
        paper: 'var(--paper)',
        ink: 'var(--ink)',
        dust: 'var(--dust)',
        hairline: { DEFAULT: 'var(--hairline)', strong: 'var(--hairline-strong)' },
        verdigris: { DEFAULT: 'var(--verdigris)', deep: 'var(--verdigris-deep)' },
      },
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        sans: ['var(--font-body)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
        // New identity — Ibarra Real Nova (editorial serif) + Karla (quiet
        // humanist sans). See fontFamily.sans/display above for the
        // untouched fonts still used by pages not yet migrated.
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
        karla: ['var(--font-karla)', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        micro: ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0.08em' }],
      },
      boxShadow: {
        carte: '0 1px 2px rgba(25, 28, 36, 0.06), 0 8px 24px -12px rgba(25, 28, 36, 0.12)',
        levee: '0 2px 4px rgba(25, 28, 36, 0.08), 0 16px 40px -16px rgba(25, 28, 36, 0.22)',
      },
    },
  },
  plugins: [],
}
export default config
