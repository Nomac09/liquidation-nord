import { AMAZON_ASSOCIATE_TAG } from '@/lib/company'

/**
 * Appends the Amazon Associates tag from the single source of truth,
 * discarding any tag= a guide's MDX might carry (a stale one there could
 * otherwise silently override the current tag and misattribute commission).
 *
 * Callers decide which URLs this applies to (e.g. only merchant="amazon",
 * or only an amazon.fr host); this function does not gate on host itself.
 * A malformed URL is returned untouched rather than thrown, since a typo
 * in an MDX file should not take down the guide's render.
 */
export function withAssociateTag(url: string): string {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return url
  }
  parsed.searchParams.delete('tag')
  parsed.searchParams.set('tag', AMAZON_ASSOCIATE_TAG)
  return parsed.toString()
}
