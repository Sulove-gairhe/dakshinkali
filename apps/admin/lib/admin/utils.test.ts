import { describe, expect, it } from "vitest";
import {
  formatNprPrice,
  mapDbStatusToStoreStatus,
  normalizeStorefrontData,
  slugifyProductName,
  validateStorefrontLiveData,
} from "./utils";
import type { ProductFormState } from "./types";

describe("admin utils", () => {
  it("formats NPR price", () => {
    expect(formatNprPrice(32980)).toBe("Rs. 32,980");
  });

  it("slugifies product names", () => {
    expect(slugifyProductName('Samsung 43" 4K TV')).toBe("samsung-43-4k-tv");
  });

  it("maps db status to storefront status", () => {
    expect(mapDbStatusToStoreStatus("active")).toBe("In Stock");
    expect(mapDbStatusToStoreStatus("low_stock")).toBe("Low Stock");
    expect(mapDbStatusToStoreStatus("inactive")).toBeNull();
  });

  it("derives badge from badges array", () => {
    expect(normalizeStorefrontData({ badges: ["Sale", "New"] }).badge).toBe(
      "Sale",
    );
  });

  it("validates live publishing requirements", () => {
    const base: ProductFormState = {
      name: "TV",
      description: "",
      price: 1000,
      categoryId: "cat",
      categoryName: "TVs",
      status: "active",
      publishingStatus: "draft",
      images: [{ id: "1", url: "https://x.test/a.jpg", filename: "a.jpg", order: 0 }],
      storefrontData: {
        slug: "tv",
        brand: "Samsung",
        shortDescription: "Great TV",
        warranty: "1 year",
      },
    };
    expect(validateStorefrontLiveData(base, base.storefrontData).valid).toBe(
      true,
    );
  });
});
