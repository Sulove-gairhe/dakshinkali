import { fetchDbProducts } from "@/lib/db-products";
import { storeProducts, type StoreProduct } from "@/lib/store-products";

export async function getAllLiveProducts(): Promise<StoreProduct[]> {
  const dbProducts = await fetchDbProducts();
  const merged = new Map<string, StoreProduct>();

  for (const product of storeProducts) {
    if (product.isActive !== false) {
      merged.set(product.slug, product);
    }
  }

  for (const product of dbProducts) {
    if (product.isActive !== false) {
      merged.set(product.slug, product);
    }
  }

  return [...merged.values()];
}
