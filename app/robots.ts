import type { MetadataRoute } from 'next'

const SITE_URL = 'https://www.souqify.fr'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/admin',
        '/admin/',
        '/ayooshi',
        '/ayooshi/',
        '/account',
        '/cart',
        '/checkout',
        '/success',
        '/login',
        '/register',
        '/verify-email',
        '/debug',
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
