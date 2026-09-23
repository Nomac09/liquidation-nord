import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { ChevronRight } from 'lucide-react'
import { getGuide, getAllGuides, formatGuideDate } from '@/lib/guides'
import { buildMdxComponents } from '@/components/mdx/mdxComponents'
import AffiliateDisclosure from '@/components/mdx/AffiliateDisclosure'
import GuideProductStrip from '@/components/guides/GuideProductStrip'
import GuideViewTracker from '@/components/guides/GuideViewTracker'
import { COMPANY } from '@/lib/company'
import { BRAND_NAME } from '@/lib/brand'

const SITE_URL = 'https://www.souqify.fr'

export function generateStaticParams() {
  return getAllGuides({ includeDrafts: true }).map((g) => ({ slug: g.frontmatter.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const guide = getGuide(slug)
  if (!guide) return {}
  const { frontmatter: fm } = guide

  return {
    title: fm.metaTitle,
    description: fm.metaDescription,
    alternates: { canonical: `/guides/${fm.slug}` },
    // A draft is reachable by URL so it can be previewed, but it must not
    // be indexed, and it is already out of the hub and the sitemap.
    robots: fm.draft ? { index: false, follow: false } : { index: true, follow: true },
    openGraph: {
      type: 'article',
      locale: 'fr_FR',
      siteName: BRAND_NAME,
      title: fm.metaTitle,
      description: fm.metaDescription,
      publishedTime: fm.publishedAt,
      modifiedTime: fm.updatedAt,
      images: fm.heroImage ? [fm.heroImage.src] : undefined,
    },
    twitter: { card: 'summary_large_image' },
  }
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const guide = getGuide(slug)
  if (!guide) notFound()

  const { frontmatter: fm } = guide

  // A relative template-literal path, so the bundler builds a context
  // module over content/guides and every .mdx is compiled at build time.
  // An alias path would not reliably produce that context.
  const { default: GuideBody } = await import(`../../../content/guides/${fm.slug}.mdx`)
  const url = `${SITE_URL}/guides/${fm.slug}`

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Guides', item: `${SITE_URL}/guides` },
      { '@type': 'ListItem', position: 3, name: fm.category, item: `${SITE_URL}/guides` },
      { '@type': 'ListItem', position: 4, name: fm.title, item: url },
    ],
  }

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: fm.title,
    description: fm.metaDescription,
    author: { '@type': 'Person', name: fm.author },
    datePublished: fm.publishedAt,
    dateModified: fm.updatedAt,
    mainEntityOfPage: url,
    image: fm.heroImage ? [fm.heroImage.src] : undefined,
    publisher: {
      '@type': 'Organization',
      name: `${COMPANY.legalName} (${BRAND_NAME})`,
      url: SITE_URL,
    },
  }

  // Emitted only alongside the visible FAQ below. Structured data that
  // describes content a visitor cannot see on the page is a structured
  // data violation, not a shortcut to a richer result.
  const faqJsonLd =
    fm.faq && fm.faq.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: fm.faq.map((item) => ({
            '@type': 'Question',
            name: item.q,
            acceptedAnswer: { '@type': 'Answer', text: item.a },
          })),
        }
      : null

  return (
    <div className="container mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}

      <GuideViewTracker
        pageSlug={fm.slug}
        category={fm.category}
        hasAffiliateLinks={fm.hasAffiliateLinks}
      />

      <nav aria-label="Fil d’Ariane">
        <ol className="flex flex-wrap items-center gap-1.5 font-mono text-[11px] uppercase tracking-widest text-dust">
          <li>
            <Link href="/" className="hover:text-ink">Accueil</Link>
          </li>
          <ChevronRight aria-hidden className="h-3 w-3" />
          <li>
            <Link href="/guides" className="hover:text-ink">Guides</Link>
          </li>
          <ChevronRight aria-hidden className="h-3 w-3" />
          <li>{fm.category}</li>
        </ol>
      </nav>

      {fm.draft && (
        <p
          role="status"
          className="mt-6 rounded-lg border border-alert/40 bg-alert-pale px-4 py-3 text-sm text-alert"
        >
          Aperçu : ce guide n’est pas publié. Il n’apparaît ni dans la liste des guides, ni dans le
          sitemap, et il est en noindex.
        </p>
      )}

      <h1 className="mt-5 font-display text-3xl leading-tight tracking-tight text-ink sm:text-4xl">
        {fm.title}
      </h1>

      <p className="mt-3 font-mono text-[11px] uppercase tracking-widest text-dust">
        {fm.author} · Mis à jour le {formatGuideDate(fm.updatedAt)}
      </p>

      {/* Above the body, therefore above the first affiliate link. */}
      {fm.hasAffiliateLinks && <AffiliateDisclosure variant="banner" />}

      {fm.heroImage && (
        <div className="relative mt-6 aspect-[16/9] w-full overflow-hidden rounded-xl bg-paper">
          <Image
            src={fm.heroImage.src}
            alt={fm.heroImage.alt}
            fill
            priority
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 768px"
          />
        </div>
      )}

      <article className="mt-6">
        <GuideBody components={buildMdxComponents(fm.slug)} />
      </article>

      {fm.faq && fm.faq.length > 0 && (
        <section className="mt-12 border-t border-hairline pt-8">
          <h2 className="font-display text-2xl tracking-tight text-ink">Questions fréquentes</h2>
          <dl className="mt-5 space-y-5">
            {fm.faq.map((item) => (
              <div key={item.q}>
                <dt className="font-semibold text-ink">{item.q}</dt>
                <dd className="mt-1.5 text-[16.5px] leading-relaxed text-ink/85">{item.a}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      <GuideProductStrip category={fm.productCategory} />
    </div>
  )
}
