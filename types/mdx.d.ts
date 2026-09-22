// MDX files compile to a React component whose default export accepts a
// `components` map. Without this, TypeScript has no idea what an .mdx
// import is.
declare module '*.mdx' {
  import type { ComponentType } from 'react'
  const MDXComponent: ComponentType<{ components?: Record<string, unknown> }>
  export default MDXComponent
}
