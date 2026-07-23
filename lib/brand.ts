// Single source of truth for the brand wordmark shown across the site.
// Swap BRAND_VARIANT to compare "Souqify" (matches the domain exactly)
// against "Soukify" (a purely visual/pronunciation-friendly logo treatment).
// The domain and all URLs stay souqify.fr regardless of this choice.
export type BrandVariant = 'souqify' | 'soukify'

const VARIANTS: Record<BrandVariant, { name: string; lead: string; tail: string }> = {
  souqify: { name: 'Souqify', lead: 'Souq', tail: 'ify' },
  soukify: { name: 'Soukify', lead: 'Souk', tail: 'ify' },
}

export const BRAND_VARIANT: BrandVariant = 'souqify'

export const BRAND_NAME = VARIANTS[BRAND_VARIANT].name
export const BRAND_SYLLABLE_SPLIT = VARIANTS[BRAND_VARIANT]
