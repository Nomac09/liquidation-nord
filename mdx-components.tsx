import type { MDXComponents } from 'mdx/types'
import { proseComponents } from '@/components/mdx/mdxComponents'

/**
 * Next's MDX pipeline looks for this file by name at the project root.
 *
 * Without it, @next/mdx falls back to @mdx-js/react's provider, which
 * calls React.createContext at module scope and therefore cannot run in a
 * server component: every guide dies at prerender with
 * "e.createContext is not a function".
 *
 * Global prose styling belongs here. The per-guide map (which injects
 * pageSlug and click positions) is still passed as a `components` prop
 * and merges over this, because it cannot be global: it holds per-render
 * counters.
 */
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...(proseComponents as MDXComponents),
    ...components,
  }
}
