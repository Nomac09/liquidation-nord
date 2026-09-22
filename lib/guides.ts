import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import matter from 'gray-matter'
import { z } from 'zod'
import { CATEGORIES } from '@/lib/categories'

export const GUIDES_DIR = join(process.cwd(), 'content', 'guides')

/**
 * The hub headings, which are editorial and deliberately NOT the shop's
 * category list.
 *
 * "Piscine" and "Vélo & mobilité" are things people search for and we can
 * write usefully about; neither exists in lib/categories.ts, and adding
 * them there would put two permanently empty categories in the manifest
 * bar and the sitemap. So a guide carries both: `category` is what the
 * hub groups it under, `productCategory` is the real catalogue category
 * its product strip pulls from. See docs/PHASE1_AUDIT.md §9.1.
 */
export const GUIDE_CATEGORIES = [
  'Jardin & Extérieur',
  'Piscine',
  'Mobilier',
  'Déco & Linge de maison',
  'Vélo & mobilité',
] as const

export type GuideCategory = (typeof GUIDE_CATEGORIES)[number]

const CATALOGUE_VALUES = CATEGORIES.map((c) => c.value) as [string, ...string[]]

const isoDate = z
  .string()
  .refine((v) => !Number.isNaN(Date.parse(v)), { message: 'must be a parseable ISO date' })

export const guideFrontmatterSchema = z.object({
  title: z.string().min(1),
  slug: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'must be lowercase kebab-case'),
  // Hard limits, not guidance: past them Google truncates, and a title
  // cut mid-word is worse than a shorter one written on purpose.
  metaTitle: z.string().min(1).max(60),
  metaDescription: z.string().min(1).max(155),
  category: z.enum(GUIDE_CATEGORIES),
  /** The catalogue category the product strip and sold-out links resolve to. */
  productCategory: z.enum(CATALOGUE_VALUES),
  author: z.string().min(1),
  publishedAt: isoDate,
  updatedAt: isoDate,
  hasAffiliateLinks: z.boolean(),
  faq: z.array(z.object({ q: z.string().min(1), a: z.string().min(1) })).optional(),
  heroImage: z.object({ src: z.string().min(1), alt: z.string().min(1) }).optional(),
  /** Excluded from the hub, the sitemap and indexing. */
  draft: z.boolean().optional().default(false),
})

export type GuideFrontmatter = z.infer<typeof guideFrontmatterSchema>

export interface Guide {
  frontmatter: GuideFrontmatter
  content: string
}

function parseGuide(filename: string): Guide {
  const raw = readFileSync(join(GUIDES_DIR, filename), 'utf8')
  const { data, content } = matter(raw)
  const parsed = guideFrontmatterSchema.safeParse(data)

  if (!parsed.success) {
    // Thrown, not warned. Frontmatter drives the meta tags, the JSON-LD
    // and the product strip; a guide that renders with a broken one is a
    // page that quietly misrepresents itself to search engines. Failing
    // the build is the cheap moment to find out.
    const issues = parsed.error.issues
      .map((i) => `  ${i.path.join('.') || '(root)'}: ${i.message}`)
      .join('\n')
    throw new Error(`Invalid frontmatter in content/guides/${filename}:\n${issues}`)
  }

  if (parsed.data.slug !== filename.replace(/\.mdx$/, '')) {
    throw new Error(
      `content/guides/${filename}: slug "${parsed.data.slug}" does not match the filename. ` +
        'They must agree, or the URL and the canonical will disagree.'
    )
  }

  return { frontmatter: parsed.data, content }
}

/** Every guide, newest first. Drafts are excluded unless asked for. */
export function getAllGuides({ includeDrafts = false } = {}): Guide[] {
  if (!existsSync(GUIDES_DIR)) return []
  return readdirSync(GUIDES_DIR)
    .filter((f) => f.endsWith('.mdx'))
    .map(parseGuide)
    .filter((g) => includeDrafts || !g.frontmatter.draft)
    .sort(
      (a, b) =>
        Date.parse(b.frontmatter.publishedAt) - Date.parse(a.frontmatter.publishedAt)
    )
}

export function getGuide(slug: string): Guide | null {
  const filename = `${slug}.mdx`
  if (!existsSync(join(GUIDES_DIR, filename))) return null
  return parseGuide(filename)
}

/** Hub grouping: categories in fixed order, empty ones dropped. */
export function getGuidesByCategory(guides: Guide[]) {
  return GUIDE_CATEGORIES.map((category) => ({
    category,
    guides: guides.filter((g) => g.frontmatter.category === category),
  })).filter((group) => group.guides.length > 0)
}

/** Whether the header should show a "Guides" link at all. */
export function hasPublishedGuides(): boolean {
  return getAllGuides().length > 0
}

export function formatGuideDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}
