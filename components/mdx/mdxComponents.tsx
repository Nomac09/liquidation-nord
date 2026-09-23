import type { ReactNode } from 'react'
import Link from 'next/link'
import OwnProduct from '@/components/mdx/OwnProduct'
import AffiliateProduct, { type AffiliateProductProps } from '@/components/mdx/AffiliateProduct'
import AffiliateDisclosure from '@/components/mdx/AffiliateDisclosure'
import ComparisonTable from '@/components/mdx/ComparisonTable'

// Prose styling lives here rather than in a typography plugin: the site
// has a small, specific type scale already, and pulling in a plugin to
// restyle five elements would mean reconciling two type systems forever.
// Applied globally through the root mdx-components.tsx, which is the hook
// Next's MDX pipeline looks for.
export const proseComponents = {
  h2: (props: { children?: ReactNode }) => (
    <h2 className="mt-10 font-display text-2xl tracking-tight text-ink" {...props} />
  ),
  h3: (props: { children?: ReactNode }) => (
    <h3 className="mt-8 font-display text-xl text-ink" {...props} />
  ),
  p: (props: { children?: ReactNode }) => (
    <p className="mt-4 text-[16.5px] leading-relaxed text-ink/85" {...props} />
  ),
  ul: (props: { children?: ReactNode }) => (
    <ul className="mt-4 list-disc space-y-2 pl-5 text-[16.5px] leading-relaxed text-ink/85" {...props} />
  ),
  ol: (props: { children?: ReactNode }) => (
    <ol className="mt-4 list-decimal space-y-2 pl-5 text-[16.5px] leading-relaxed text-ink/85" {...props} />
  ),
  blockquote: (props: { children?: ReactNode }) => (
    <blockquote
      className="mt-6 border-l-2 border-verdigris pl-4 text-[16.5px] italic leading-relaxed text-ink/75"
      {...props}
    />
  ),
  strong: (props: { children?: ReactNode }) => (
    <strong className="font-semibold text-ink" {...props} />
  ),
  hr: () => <hr className="mt-8 border-hairline" />,
  table: (props: { children?: ReactNode }) => (
    <div className="mt-6 overflow-x-auto rounded-lg border border-hairline">
      <table className="w-full text-sm" {...props} />
    </div>
  ),
  th: (props: { children?: ReactNode }) => (
    <th className="bg-paper px-4 py-2.5 text-left font-semibold text-ink" {...props} />
  ),
  td: (props: { children?: ReactNode }) => (
    <td className="border-t border-hairline px-4 py-2.5 text-ink/85" {...props} />
  ),
  a: ({ href = '', ...props }: { href?: string; children?: ReactNode }) => {
    const external = /^https?:\/\//.test(href)
    if (external) {
      // Plain outbound links in prose are editorial, not sponsored. Any
      // link that earns a commission goes through <AffiliateProduct /> or
      // a ComparisonTable row, which carry rel="sponsored" and the badge.
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-verdigris-deep underline underline-offset-2 hover:text-ink"
          {...props}
        />
      )
    }
    return (
      <Link
        href={href}
        className="text-verdigris-deep underline underline-offset-2 hover:text-ink"
        {...props}
      />
    )
  },
}

/**
 * The per-guide component map, merged over proseComponents by the MDX
 * provider.
 *
 * Built per render rather than at module scope, because `position` is a
 * counter: a module-level one would be shared across concurrent requests
 * and produce positions that belong to somebody else's page view.
 * pageSlug and position are injected here so an author never has to
 * repeat them in MDX, where they would drift the moment a card is moved.
 */
export function buildMdxComponents(pageSlug: string) {
  let affiliatePosition = 0
  let ownPosition = 0

  return {
    OwnProduct: (props: { id: string }) => {
      ownPosition += 1
      return <OwnProduct {...props} />
    },
    AffiliateProduct: (props: AffiliateProductProps) => {
      affiliatePosition += 1
      return <AffiliateProduct {...props} pageSlug={pageSlug} position={affiliatePosition} />
    },
    AffiliateDisclosure,
    ComparisonTable,
  }
}
