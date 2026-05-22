import type { MetadataRoute } from 'next';
import { fetchCatalogProducts } from '@/lib/product-catalog-api';
import { getSiteUrl } from '@/lib/site';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteUrl();
  const now = new Date();
  const catalogProducts = await fetchCatalogProducts();
  const productEntries: MetadataRoute.Sitemap = catalogProducts.map((product) => ({
    url: new URL(product.href, baseUrl).toString(),
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  return [
    {
      url: new URL('/', baseUrl).toString(),
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: new URL('/products', baseUrl).toString(),
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    ...productEntries,
  ];
}
