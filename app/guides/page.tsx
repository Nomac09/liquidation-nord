import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { getAllGuides, getGuidesByCategory, formatGuideDate } from '@/lib/guides'
import { BRAND_NAME } from '@/lib/brand'

export const metadata: Metadata = {
  title: 'Guides',
  description:
    'Nos guides d’achat jardin, piscine, mobilier, déco et mobilité : comment choisir, ce qui compte vraiment, et ce que nous avons en stock à Bondues.',
  alternates: { canonical: '/guides' },
  robots: { index: true, follow: true },
}

export default function GuidesHubPage() {
  const guides = getAllGuides()
  const groups = getGuidesByCategory(guides)

  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      <p className="tag-label">Guides</p>
      <h1 className="mt-2 font-display text-3xl tracking-tight text-ink">Guides d’achat</h1>
      <p className="mt-3 max-w-2xl text-[16.5px] leading-relaxed text-ink/85">
        Ce qui compte vraiment avant d’acheter, écrit à partir de ce que nous voyons passer à
        l’entrepôt. Quand notre stock ne répond pas au besoin, nous le disons et nous renvoyons
        ailleurs.
      </p>

      {groups.length === 0 ? (
        <div className="mt-10 rounded-xl border border-dashed border-hairline bg-surface/60 py-16 text-center">
          <p className="font-display text-xl text-ink">Les premiers guides arrivent bientôt.</p>
          <p className="mt-2 text-sm text-dust">
            En attendant, la collection est là.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-verdigris px-8 py-3 text-sm font-semibold text-stone transition-colors hover:bg-verdigris-deep"
          >
            Voir la collection
            <ArrowRight aria-hidden className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="mt-12 space-y-12">
          {groups.map(({ category, guides: inCategory }) => (
            <section key={category}>
              <h2 className="border-b border-hairline pb-2 font-mono text-micro uppercase tracking-widest text-dust">
                {category}
              </h2>
              <ul className="mt-5 grid gap-4 sm:grid-cols-2">
                {inCategory.map(({ frontmatter }) => (
                  <li key={frontmatter.slug}>
                    <Link
                      href={`/guides/${frontmatter.slug}`}
                      className="group flex h-full flex-col rounded-xl border border-hairline bg-surface p-5 shadow-carte transition-colors hover:border-verdigris"
                    >
                      <h3 className="font-display text-lg leading-snug text-ink group-hover:text-verdigris-deep">
                        {frontmatter.title}
                      </h3>
                      <p className="mt-2 flex-1 text-sm leading-relaxed text-ink/80">
                        {frontmatter.metaDescription}
                      </p>
                      <p className="mt-4 font-mono text-[11px] uppercase tracking-widest text-dust">
                        Mis à jour le {formatGuideDate(frontmatter.updatedAt)}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      <p className="mt-14 border-t border-hairline pt-6 text-sm text-dust">
        Certains guides contiennent des liens partenaires, toujours signalés.{' '}
        <Link href="/transparence-affiliation" className="text-verdigris-deep hover:underline">
          Comment {BRAND_NAME} gagne sa vie
        </Link>
        .
      </p>
    </div>
  )
}
