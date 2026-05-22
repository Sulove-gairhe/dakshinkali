import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/account', '/cart', '/wishlist', '/compare', '/login', '/api'],
    },
    sitemap: `${getSiteUrl()}/sitemap.xml`,
  };
}
