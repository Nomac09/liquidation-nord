const createMDX = require('@next/mdx')

/**
 * MDX is compiled by Next's own pipeline rather than rendered at request
 * time by next-mdx-remote. That is not a preference: Next 15's App Router
 * uses a vendored copy of React, while a runtime MDX renderer resolves
 * react/jsx-runtime from node_modules, and the two copies produce
 * "A React Element from an older version of React was rendered" on every
 * guide. Compiling through the bundler means guide JSX and app JSX go
 * through exactly one runtime.
 *
 * remark-frontmatter is what keeps the YAML block from rendering as a
 * paragraph of text: gray-matter reads that block separately in
 * lib/guides.ts for metadata, so it must be parsed out of the body here.
 */
const withMDX = createMDX({
  options: {
    remarkPlugins: [['remark-gfm'], ['remark-frontmatter', ['yaml']]],
  },
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md', 'mdx'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.ufs.sh' },
      { protocol: 'https', hostname: 'utfs.io' },
      { protocol: 'https', hostname: 'uploadthing.com' },
    ],
  },
}

module.exports = withMDX(nextConfig)
