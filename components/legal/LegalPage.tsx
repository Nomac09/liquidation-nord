import type { ReactNode } from 'react'

/**
 * The shell every statutory page shares: one column, a stated version
 * date, and a layout that survives being printed.
 *
 * Printing matters more here than anywhere else on the site. A buyer
 * exercising a withdrawal right, or an adviser checking the terms, prints
 * or saves the CGV as the document that was in force on a given day. So
 * the site chrome is hidden (print:hidden on the header, footer, filter
 * bar and banners), the column goes full width, and the version date sits
 * at the top where it belongs rather than being a runtime `new Date()`
 * that quietly claims the terms came into force this morning, which is
 * what both existing legal pages did.
 */
export default function LegalPage({
  eyebrow,
  title,
  lastUpdated,
  dateLabel = 'En vigueur au',
  intro,
  children,
}: {
  eyebrow: string
  title: string
  /** Already formatted for display, e.g. "12 octobre 2026". */
  lastUpdated: string
  dateLabel?: string
  intro?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-12 print:max-w-none print:px-0 print:py-0">
      <p className="tag-label print:hidden">{eyebrow}</p>
      <h1 className="mt-2 font-display text-3xl tracking-tight text-ink print:mt-0 print:text-2xl">
        {title}
      </h1>
      <p className="mt-3 text-sm text-dust">{dateLabel} {lastUpdated}.</p>
      {intro && (
        <div className="mt-4 space-y-3 text-[15px] leading-relaxed text-ink/85">{intro}</div>
      )}
      <div className="mt-8 print:mt-6">{children}</div>
    </div>
  )
}

/** One numbered article. `break-inside-avoid` keeps it off a page seam. */
export function LegalSection({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <section className="border-t border-hairline py-8 first:border-t-0 first:pt-0 print:break-inside-avoid print:py-4">
      <h2 className="font-display text-xl text-ink print:text-lg">{title}</h2>
      <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-ink/85 print:text-[12pt]">
        {children}
      </div>
    </section>
  )
}
