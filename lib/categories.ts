// Single source of truth for the category taxonomy — used by the
// manifest bar, listing pages, product breadcrumbs, and filters.
export const CATEGORIES = [
  { value: 'Jardin & Extérieur', label: 'Jardin & Extérieur' },
  { value: 'Mobilier', label: 'Mobilier' },
  { value: 'Jardinage', label: 'Jardinage' },
  { value: 'Déco & Linge de maison', label: 'Déco & Linge de maison' },
  { value: 'Divers', label: 'Divers' },
] as const

export type CategoryValue = (typeof CATEGORIES)[number]['value']

export const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.value, c.label])
)

export const CATEGORY_ORDER = CATEGORIES.map((c) => c.value)
