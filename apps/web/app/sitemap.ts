import type { MetadataRoute } from "next";
import { getAllLiveProducts } from "@/lib/catalog";
import { publishedBlogPosts } from "@/lib/blog-posts";
import {
  absoluteUrl,
  brandCanonical,
  brandCategoryCanonical,
  categoryCanonical,
  getProductLandingSlugs,
  productCanonical,
  productMatchesBrandSlug,
  productMatchesCategorySlug,
} from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const products = await getAllLiveProducts();
  const landingSlugs = getProductLandingSlugs(products);
  const brandCategoryUrls = new Set<string>();

  for (const brand of landingSlugs.brands) {
    for (const category of landingSlugs.categories) {
      if (
        products.some(
          (product) =>
            productMatchesBrandSlug(product, brand) &&
            productMatchesCategorySlug(product, category),
        )
      ) {
        brandCategoryUrls.add(brandCategoryCanonical(brand, category));
      }
    }
  }

  return [
    {
      url: absoluteUrl("/"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: absoluteUrl("/blogs"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.55,
    },
    {
      url: absoluteUrl("/categories/samsung-tv"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: absoluteUrl("/login"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.2,
    },
    ...publishedBlogPosts.map((post) => ({
      url: absoluteUrl(`/blogs/${post.slug}`),
      lastModified: new Date(`${post.publishedAt}T00:00:00`),
      changeFrequency: "monthly" as const,
      priority: 0.45,
    })),
    ...products.map((product) => ({
      url: productCanonical(product),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...landingSlugs.categories.map((category) => ({
      url: categoryCanonical(category),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...landingSlugs.brands.map((brand) => ({
      url: brandCanonical(brand),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.65,
    })),
    ...[...brandCategoryUrls].map((url) => ({
      url,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];
}
