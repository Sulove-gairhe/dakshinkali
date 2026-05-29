import { storeProducts, type StoreProduct } from "@/lib/store-products";

export type SearchSort = "best-match" | "price-high-low" | "price-low-high";

export type IndexedProduct = {
  id: string;
  title: string;
  slug: string;
  brand?: string;
  category?: string;
  collection?: string;
  normalizedBrand?: string;
  normalizedCategory?: string;
  normalizedCollection?: string;
  price?: number;
  originalPrice?: number;
  salePrice?: number;
  rating?: number;
  image?: string;
  availability?: string;
  description?: string;
  tags?: string[];
  product: StoreProduct;
  index: number;
};

export type SearchProductsInput = {
  q?: string | null;
  brand?: string | null;
  category?: string | null;
  sort?: string | null;
  /** Additional products (e.g. from the DB) to include in search results. */
  extraProducts?: StoreProduct[];
  /** DB categories to include in intent parsing and category filter options. */
  extraCategories?: { name: string; slug: string }[];
};

export type SearchProductsResult = {
  products: StoreProduct[];
  indexedProducts: IndexedProduct[];
  sort: SearchSort;
  heading: string;
  eyebrow: string;
  resultLabel: string;
  activeBrand?: string;
  activeCategory?: string;
  activeBrandSlug?: string;
  activeCategorySlug?: string;
  query?: string;
  brandOptions: FilterOption[];
  categoryOptions: FilterOption[];
};

export type FilterOption = {
  name: string;
  slug: string;
  count: number;
  synonyms?: string[];
};

type FilterEntry = {
  name: string;
  slug: string;
  synonyms: string[];
};

type ScoredProduct = {
  product: IndexedProduct;
  score: number;
};

type QueryIntent = {
  brandSlug?: string;
  brandTerm?: string;
  categorySlug?: string;
  categoryTerm?: string;
  remainingQuery: string;
  hasIntent: boolean;
};

const SORT_VALUES: SearchSort[] = [
  "best-match",
  "price-high-low",
  "price-low-high",
];

const CATEGORY_DISPLAY: Record<string, string> = {
  televisions: "Televisions",
  refrigerator: "Refrigerators",
  "washing-machine": "Washing Machines",
  freezer: "Freezers",
  "water-dispenser": "Water Dispensers",
  "kitchen-appliance": "Kitchen Appliances",
};

const CATEGORY_ALIASES: Record<string, string> = {
  tv: "televisions",
  tvs: "televisions",
  "smart tv": "televisions",
  "smart tvs": "televisions",
  television: "televisions",
  televisions: "televisions",
  "led tv": "televisions",
  "led tvs": "televisions",
  "android tv": "televisions",
  "google tv": "televisions",
  fridge: "refrigerator",
  fridges: "refrigerator",
  refrigerator: "refrigerator",
  refrigerators: "refrigerator",
  "double door refrigerator": "refrigerator",
  "double door refrigerators": "refrigerator",
  "single door refrigerator": "refrigerator",
  "single door refrigerators": "refrigerator",
  washer: "washing-machine",
  "washing machine": "washing-machine",
  "washing machines": "washing-machine",
  laundry: "washing-machine",
  freezer: "freezer",
  freezers: "freezer",
  "chest freezer": "freezer",
  "deep freezer": "freezer",
  dispenser: "water-dispenser",
  "water dispenser": "water-dispenser",
  "water dispensers": "water-dispenser",
  cooker: "kitchen-appliance",
  "rice cooker": "kitchen-appliance",
  "kitchen appliance": "kitchen-appliance",
  "kitchen appliances": "kitchen-appliance",
  "kitchen-appliances": "kitchen-appliance",
};

const BRAND_ALIASES: Record<string, string> = {
  himista: "himstar",
  himsta: "himstar",
};

const QUERY_SYNONYMS = [
  ["fridge", "fridges", "refrigerator", "refrigerators"],
  ["tv", "tvs", "television", "televisions", "smart tv", "led tv", "android tv"],
  ["washer", "washing machine", "washing machines", "laundry"],
  ["water dispenser", "dispensers", "dispenser"],
  ["rice cooker", "cooker", "kitchen appliances"],
];

export const indexedProducts: IndexedProduct[] = storeProducts.map(
  (product, index) => {
    const salePrice = parsePrice(product.currentPrice);
    const originalPrice = parsePrice(product.oldPrice);
    const normalizedCategory = normalizeCategorySlug(product.category);
    const normalizedCollection = product.collection
      ? normalizeCategorySlug(product.collection)
      : undefined;
    const normalizedBrand = normalizeBrandSlug(product.brand);

    return {
      id: product.id,
      title: product.name,
      slug: product.slug,
      brand: product.brand,
      category: getCategoryDisplayName(normalizedCategory),
      collection: product.collection,
      normalizedBrand,
      normalizedCategory,
      normalizedCollection,
      price: salePrice ?? originalPrice,
      originalPrice,
      salePrice,
      image: product.image,
      availability: product.status,
      description: product.shortDescription,
      tags: product.searchTerms,
      product,
      index,
    };
  },
);

export function searchProducts(input: SearchProductsInput): SearchProductsResult {
  const query = input.q?.trim() || "";
  const brandSlug = input.brand ? normalizeBrandSlug(input.brand) : "";
  const categorySlug = input.category ? normalizeCategorySlug(input.category) : "";
  const sort = normalizeSort(input.sort);

  // Build merged category list: static + DB categories (deduped by slug)
  const staticCategories = getAvailableCategories();
  const staticCategorySlugs = new Set(staticCategories.map((c) => c.slug));
  const extraCategoryEntries = (input.extraCategories ?? [])
    .map((c) => ({
      name: c.name,
      slug: c.slug, // use the raw DB slug as-is — no normalization
      synonyms: [] as string[],
    }))
    .filter((c) => !staticCategorySlugs.has(c.slug));
  const allCategories = [...staticCategories, ...extraCategoryEntries];

  const intent = parseQueryIntentWithCategories(query, allCategories);
  const effectiveBrandSlug = brandSlug || intent.brandSlug || "";
  const effectiveCategorySlug = categorySlug || intent.categorySlug || "";
  const queryForScoring = getQueryForScoring(query, intent, {
    brandWasExplicit: Boolean(brandSlug),
    categoryWasExplicit: Boolean(categorySlug),
  });
  const queryTerms = queryForScoring ? getSearchTerms(queryForScoring) : [];
  const actualBrand = brandSlug ? getBrandDisplayName(brandSlug) : undefined;
  const headingBrand = effectiveBrandSlug
    ? getBrandDisplayName(effectiveBrandSlug)
    : undefined;
  const activeCategory = categorySlug
    ? getCategoryDisplayNameFromList(categorySlug, allCategories)
    : undefined;
  const headingCategory = effectiveCategorySlug
    ? getCategoryDisplayNameFromList(effectiveCategorySlug, allCategories)
    : undefined;

  // Merge extra (DB) products, deduplicating by slug (DB takes precedence)
  const staticSlugs = new Set(indexedProducts.map((p) => p.slug));
  const extraIndexed: IndexedProduct[] = (input.extraProducts ?? [])
    .filter((p) => !staticSlugs.has(p.slug))
    .map((product, i) => {
      const salePrice = parsePrice(product.currentPrice);
      const originalPrice = parsePrice(product.oldPrice);
      // Use the raw category string from the DB product as the normalizedCategory
      // so it matches the DB category slug exactly (e.g. "stand-fans")
      const rawCategory = product.category ?? "";
      const normalizedCategory = slugify(normalizeText(rawCategory));
      const normalizedCollection = product.collection
        ? slugify(normalizeText(product.collection))
        : undefined;
      const normalizedBrand = normalizeBrandSlug(product.brand);
      return {
        id: product.id,
        title: product.name,
        slug: product.slug,
        brand: product.brand,
        category: rawCategory,
        collection: product.collection,
        normalizedBrand,
        normalizedCategory,
        normalizedCollection,
        price: salePrice ?? originalPrice,
        originalPrice,
        salePrice,
        image: product.image,
        availability: product.status,
        description: product.shortDescription,
        tags: product.searchTerms,
        product,
        index: indexedProducts.length + i,
      };
    });

  const allIndexed = [...indexedProducts, ...extraIndexed];

  let scoredProducts = allIndexed.map((product) => ({
    product,
    score: queryTerms.length > 0 ? scoreProduct(product, queryTerms, queryForScoring) : 0,
  }));

  if (effectiveBrandSlug) {
    scoredProducts = scoredProducts.filter(
      ({ product }) => product.normalizedBrand === effectiveBrandSlug,
    );
  }

  if (effectiveCategorySlug) {
    scoredProducts = scoredProducts.filter(
      ({ product }) => productMatchesCategory(product, effectiveCategorySlug),
    );
  }

  if (queryTerms.length > 0) {
    scoredProducts = scoredProducts.filter(({ score }) => score > 0);
  } else if (query && !intent.hasIntent) {
    scoredProducts = [];
  }

  const sortedProducts = sortScoredProducts(scoredProducts, sort, queryTerms.length > 0);

  // Build category options: product-derived counts + any DB categories not yet present
  const productCategoryOptions = getCategoryFilterOptions({
    query,
    selectedBrandSlug: brandSlug,
    selectedCategorySlug: categorySlug,
    source: allIndexed,
  });
  const productCategorySlugs = new Set(productCategoryOptions.map((o) => o.slug));
  const dbOnlyCategories = allCategories
    .filter((c) => !productCategorySlugs.has(c.slug))
    .map((c) => ({ name: c.name, slug: c.slug, count: 0 }));
  const categoryOptions = [...productCategoryOptions, ...dbOnlyCategories].sort(
    (a, b) => a.name.localeCompare(b.name),
  );

  const brandOptions = getBrandFilterOptions({
    query,
    selectedBrandSlug: brandSlug,
    selectedCategorySlug: categorySlug,
    source: allIndexed,
  });

  return {
    products: sortedProducts.map(({ product }) => product.product),
    indexedProducts: sortedProducts.map(({ product }) => product),
    sort,
    heading: getHeading({ query, brand: headingBrand, category: headingCategory }),
    eyebrow: getEyebrow({ query, brand: headingBrand, category: headingCategory }),
    resultLabel: `${sortedProducts.length} ${sortedProducts.length === 1 ? "product" : "products"
      } found`,
    activeBrand: actualBrand,
    activeCategory,
    activeBrandSlug: brandSlug || undefined,
    activeCategorySlug: categorySlug || undefined,
    query: query || undefined,
    brandOptions,
    categoryOptions,
  };
}

export function normalizeSort(sort?: string | null): SearchSort {
  return SORT_VALUES.includes(sort as SearchSort)
    ? (sort as SearchSort)
    : "best-match";
}

export function getAvailableBrands() {
  return [
    ...new Map(
      indexedProducts
        .filter((product) => product.brand && product.normalizedBrand)
        .map((product) => [
          product.normalizedBrand,
          {
            name: product.brand as string,
            slug: product.normalizedBrand as string,
            synonyms: getBrandSynonyms(product.brand as string),
          },
        ]),
    ).values(),
  ].sort((left, right) => left.name.localeCompare(right.name));
}

export function getAvailableCategories() {
  return [
    ...new Map(
      indexedProducts
        .flatMap(getProductCategoryEntries)
        .map((category) => [category.slug, category]),
    ).values(),
  ].sort((left, right) => left.name.localeCompare(right.name));
}

export function getBrandFilterOptions({
  query,
  selectedBrandSlug,
  selectedCategorySlug,
  source,
}: {
  query?: string;
  selectedBrandSlug?: string;
  selectedCategorySlug?: string;
  source?: IndexedProduct[];
} = {}) {
  return getFilterOptions("brand", {
    query,
    selectedBrandSlug,
    selectedCategorySlug,
    source,
  });
}

export function getCategoryFilterOptions({
  query,
  selectedBrandSlug,
  selectedCategorySlug,
  source,
}: {
  query?: string;
  selectedBrandSlug?: string;
  selectedCategorySlug?: string;
  source?: IndexedProduct[];
} = {}) {
  return getFilterOptions("category", {
    query,
    selectedBrandSlug,
    selectedCategorySlug,
    source,
  });
}

export function getSearchTerms(query: string) {
  const normalizedQuery = normalizeText(query);
  const terms = new Set<string>([normalizedQuery]);
  const normalizedCategory = normalizeCategorySlug(query);
  const normalizedBrand = normalizeBrandSlug(query);

  if (normalizedCategory !== slugify(normalizedQuery)) {
    terms.add(normalizedCategory);
    terms.add(normalizeText(getCategoryDisplayName(normalizedCategory)));
  }

  if (normalizedBrand !== slugify(normalizedQuery)) {
    terms.add(normalizedBrand);
  }

  for (const token of normalizedQuery.split(" ")) {
    if (token.length > 1) {
      terms.add(token);
    }
  }

  for (const group of QUERY_SYNONYMS) {
    if (group.some((term) => normalizedQuery.includes(normalizeText(term)))) {
      group.forEach((term) => terms.add(normalizeText(term)));
      terms.add(normalizeCategorySlug(group[0]));
    }
  }

  return [...terms].filter(Boolean);
}

export function scoreValues(terms: string[], values: string[]) {
  const haystack = normalizeText(values.join(" "));
  let score = 0;

  for (const term of terms) {
    if (!term) {
      continue;
    }

    const normalizedTerm = normalizeText(term);

    if (haystack === normalizedTerm) {
      score += 120;
    } else if (haystack.startsWith(normalizedTerm)) {
      score += 70;
    } else if (haystack.includes(normalizedTerm)) {
      score += 35;
    } else if (isLooseMatch(normalizedTerm, haystack)) {
      score += 12;
    }
  }

  return score;
}

export function normalizeCategorySlug(value: string) {
  const normalized = normalizeText(value);
  const alias = CATEGORY_ALIASES[normalized];

  if (alias) {
    return alias;
  }

  if (normalized.includes("refrigerator")) {
    return "refrigerator";
  }

  if (normalized.includes("washing")) {
    return "washing-machine";
  }

  if (normalized.includes("television") || /\btv\b/.test(normalized)) {
    return "televisions";
  }

  return slugify(normalized);
}

export function getCategoryDisplayName(value: string) {
  const normalized = normalizeCategorySlug(value);
  return CATEGORY_DISPLAY[normalized] ?? titleCase(normalized.replace(/-/g, " "));
}

export function normalizeBrandSlug(value: string) {
  const normalized = normalizeText(value);
  return BRAND_ALIASES[normalized] ?? slugify(normalized);
}

export function getBrandDisplayName(slug: string) {
  const normalizedSlug = normalizeBrandSlug(slug);
  const actualBrand = indexedProducts.find(
    (product) => product.normalizedBrand === normalizedSlug,
  )?.brand;

  if (actualBrand) {
    return actualBrand;
  }

  if (normalizedSlug === "tcl") {
    return "TCL";
  }

  return titleCase(normalizedSlug.replace(/-/g, " "));
}

export function normalizeText(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function slugify(value: string) {
  return normalizeText(value).replace(/\s+/g, "-");
}

export function parseQueryIntent(query: string): QueryIntent {
  return parseQueryIntentWithCategories(query, getAvailableCategories());
}

function parseQueryIntentWithCategories(
  query: string,
  categories: { name: string; slug: string; synonyms: string[] }[],
): QueryIntent {
  const normalizedQuery = normalizeText(query);

  if (!normalizedQuery) {
    return { remainingQuery: "", hasIntent: false };
  }

  const brandMatch = getAvailableBrands()
    .flatMap((brand) =>
      [brand.name, brand.slug, ...brand.synonyms].map((value) => ({
        slug: brand.slug,
        term: normalizeText(value),
      })),
    )
    .filter(({ term }) => term && hasPhrase(normalizedQuery, term))
    .sort((left, right) => right.term.length - left.term.length)[0];

  const categoryMatch = categories
    .flatMap((category) =>
      [category.name, category.slug, ...(category.synonyms ?? [])].map((value) => ({
        slug: category.slug,
        term: normalizeText(value),
      })),
    )
    .filter(({ term }) => term && hasPhrase(normalizedQuery, term))
    .sort((left, right) => right.term.length - left.term.length)[0];

  const matchedTerms = [brandMatch?.term, categoryMatch?.term].filter(
    Boolean,
  ) as string[];
  const remainingQuery = removeMatchedTerms(normalizedQuery, matchedTerms);

  return {
    brandSlug: brandMatch?.slug,
    brandTerm: brandMatch?.term,
    categorySlug: categoryMatch?.slug,
    categoryTerm: categoryMatch?.term,
    remainingQuery,
    hasIntent: Boolean(brandMatch || categoryMatch),
  };
}

function getCategoryDisplayNameFromList(
  slug: string,
  categories: { name: string; slug: string }[],
): string {
  const match = categories.find((c) => c.slug === slug);
  if (match) return match.name;
  return getCategoryDisplayName(slug);
}

function scoreProduct(product: IndexedProduct, terms: string[], rawQuery: string) {
  const normalizedQuery = normalizeText(rawQuery);
  const normalizedCategory = normalizeCategorySlug(rawQuery);
  let score = 0;

  if (normalizeText(product.title) === normalizedQuery) {
    score += 250;
  }

  if (normalizeText(product.title).includes(normalizedQuery)) {
    score += 120;
  }

  if (product.normalizedBrand === normalizeBrandSlug(rawQuery)) {
    score += 100;
  }

  if (product.normalizedCategory === normalizedCategory) {
    score += 95;
  }

  if (product.normalizedCollection === normalizedCategory) {
    score += 90;
  }

  score += scoreValues(terms, [
    product.title,
    product.brand ?? "",
    product.category ?? "",
    product.normalizedCategory ?? "",
    product.description ?? "",
    ...(product.tags ?? []),
  ]);

  return score;
}

function getFilterOptions(
  type: "brand" | "category",
  {
    query,
    selectedBrandSlug,
    selectedCategorySlug,
    source: sourceOverride,
  }: {
    query?: string;
    selectedBrandSlug?: string;
    selectedCategorySlug?: string;
    source?: IndexedProduct[];
  },
): FilterOption[] {
  const normalizedBrand = selectedBrandSlug
    ? normalizeBrandSlug(selectedBrandSlug)
    : "";
  const normalizedCategory = selectedCategorySlug
    ? normalizeCategorySlug(selectedCategorySlug)
    : "";
  const intent = parseQueryIntent(query || "");
  const queryConstraintBrand = !normalizedBrand ? intent.brandSlug : "";
  const queryConstraintCategory = !normalizedCategory ? intent.categorySlug : "";

  const allProducts = sourceOverride ?? indexedProducts;

  const source = allProducts.filter((product) => {
    if (type === "brand" && normalizedCategory) {
      return productMatchesCategory(product, normalizedCategory);
    }

    if (type === "category" && normalizedBrand) {
      return product.normalizedBrand === normalizedBrand;
    }

    if (type === "brand" && queryConstraintCategory) {
      return productMatchesCategory(product, queryConstraintCategory);
    }

    if (type === "category" && queryConstraintBrand) {
      return product.normalizedBrand === queryConstraintBrand;
    }

    return true;
  });

  const counts = new Map<string, FilterOption>();

  for (const product of source) {
    const entries =
      type === "brand"
        ? product.normalizedBrand && product.brand
          ? [
            {
              name: product.brand,
              slug: product.normalizedBrand,
              synonyms: getBrandSynonyms(product.brand),
            },
          ]
          : []
        : getProductCategoryEntries(product);

    for (const entry of entries) {
      const existing = counts.get(entry.slug);
      counts.set(entry.slug, {
        ...entry,
        count: (existing?.count || 0) + 1,
      });
    }
  }

  return [...counts.values()].sort((left, right) =>
    left.name.localeCompare(right.name),
  );
}

function productMatchesCategory(product: IndexedProduct, categorySlug: string) {
  return (
    product.normalizedCategory === categorySlug ||
    product.normalizedCollection === categorySlug
  );
}

function getProductCategoryEntries(product: IndexedProduct): FilterEntry[] {
  const entries = [
    product.normalizedCategory
      ? {
        name: getCategoryDisplayName(product.normalizedCategory),
        slug: product.normalizedCategory,
        synonyms: getCategorySynonyms(product.normalizedCategory),
      }
      : undefined,
    product.normalizedCollection
      ? {
        name: getCategoryDisplayName(product.normalizedCollection),
        slug: product.normalizedCollection,
        synonyms: getCategorySynonyms(product.normalizedCollection),
      }
      : undefined,
  ].filter((entry): entry is FilterEntry => Boolean(entry));

  return [...new Map(entries.map((entry) => [entry.slug, entry])).values()];
}

function hasPhrase(haystack: string, phrase: string) {
  return new RegExp(`(^| )${escapeRegExp(phrase)}( |$)`).test(haystack);
}

function removeMatchedTerms(query: string, terms: string[]) {
  return terms
    .reduce(
      (remaining, term) =>
        remaining.replace(new RegExp(`(^| )${escapeRegExp(term)}( |$)`, "g"), " "),
      query,
    )
    .replace(/\s+/g, " ")
    .trim();
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getQueryForScoring(
  query: string,
  intent: QueryIntent,
  {
    brandWasExplicit,
    categoryWasExplicit,
  }: {
    brandWasExplicit: boolean;
    categoryWasExplicit: boolean;
  },
) {
  if (!intent.hasIntent) {
    return query.trim();
  }

  const termsToRemove = [
    brandWasExplicit ? undefined : intent.brandTerm,
    categoryWasExplicit ? undefined : intent.categoryTerm,
  ].filter(Boolean) as string[];

  return removeMatchedTerms(normalizeText(query), termsToRemove);
}

function sortScoredProducts(
  products: ScoredProduct[],
  sort: SearchSort,
  hasQuery: boolean,
) {
  return [...products].sort((left, right) => {
    if (sort === "price-high-low") {
      return comparePrice(right.product, left.product) || left.product.index - right.product.index;
    }

    if (sort === "price-low-high") {
      return comparePrice(left.product, right.product) || left.product.index - right.product.index;
    }

    if (hasQuery && right.score !== left.score) {
      return right.score - left.score;
    }

    if (hasActualRating(left.product, right.product)) {
      return (right.product.rating ?? 0) - (left.product.rating ?? 0);
    }

    return left.product.index - right.product.index;
  });
}

function comparePrice(left: IndexedProduct, right: IndexedProduct) {
  const leftPrice = getEffectivePrice(left);
  const rightPrice = getEffectivePrice(right);

  if (leftPrice === undefined && rightPrice === undefined) {
    return 0;
  }

  if (leftPrice === undefined) {
    return 1;
  }

  if (rightPrice === undefined) {
    return -1;
  }

  return leftPrice - rightPrice;
}

function getEffectivePrice(product: IndexedProduct) {
  return product.salePrice ?? product.price ?? product.originalPrice;
}

function hasActualRating(left: IndexedProduct, right: IndexedProduct) {
  return left.rating !== undefined || right.rating !== undefined;
}

function parsePrice(value?: string) {
  if (!value) {
    return undefined;
  }

  const parsed = Number(value.replace(/[^0-9.]/g, ""));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function getBrandSynonyms(brand: string) {
  return normalizeBrandSlug(brand) === "himstar" ? ["himista", "himsta"] : [];
}

function getCategorySynonyms(categorySlug: string) {
  const synonyms = Object.entries(CATEGORY_ALIASES)
    .filter(([, slug]) => slug === categorySlug)
    .map(([alias]) => alias);

  return [...new Set(synonyms)];
}

function getHeading({
  query,
  brand,
  category,
}: {
  query?: string;
  brand?: string;
  category?: string;
}) {
  if (brand && category && query) {
    return `${brand} ${category} for "${query}"`;
  }

  if (brand && category) {
    return `${brand} ${category}`;
  }

  if (brand && query) {
    return `${brand} Products for "${query}"`;
  }

  if (brand) {
    return `${brand} Products`;
  }

  if (category && query) {
    return `${category} for "${query}"`;
  }

  if (category) {
    return category;
  }

  if (query) {
    return `Search results for "${query}"`;
  }

  return "Search Products";
}

function getEyebrow({
  query,
  brand,
  category,
}: {
  query?: string;
  brand?: string;
  category?: string;
}) {
  if (brand) {
    return query ? `Searching within ${brand}` : "Brand collection";
  }

  if (category) {
    return query ? `Searching within ${category}` : "Category collection";
  }

  return query ? "Catalog search" : "Browse catalog";
}

function isLooseMatch(term: string, haystack: string) {
  if (term.length < 4) {
    return false;
  }

  return haystack.split(" ").some((token) => {
    if (
      token.length < 4 ||
      token[0] !== term[0] ||
      Math.abs(token.length - term.length) > 2
    ) {
      return false;
    }

    return getEditDistance(term, token) <= 1;
  });
}

function getEditDistance(left: string, right: string) {
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  const current = Array.from({ length: right.length + 1 }, () => 0);

  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    current[0] = leftIndex;

    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const cost = left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1;
      current[rightIndex] = Math.min(
        current[rightIndex - 1] + 1,
        previous[rightIndex] + 1,
        previous[rightIndex - 1] + cost,
      );
    }

    for (let index = 0; index <= right.length; index += 1) {
      previous[index] = current[index];
    }
  }

  return previous[right.length];
}

function titleCase(value: string) {
  return value
    .split(" ")
    .map((word) =>
      word.length <= 3
        ? word.toUpperCase()
        : `${word.charAt(0).toUpperCase()}${word.slice(1)}`,
    )
    .join(" ");
}
