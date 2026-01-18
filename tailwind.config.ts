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
        'oak': '#D4A574',
        'beige': '#F5F2E8',
        'anthracite': '#2B2B2B',
        'warm-gray': '#8B8680',
      },
    },
  },
  plugins: [],
}
export default config
