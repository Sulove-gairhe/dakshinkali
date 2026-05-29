#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const { pathToFileURL } = require("node:url");
const { createClient } = require("@supabase/supabase-js");
const ts = require("typescript");
require("dotenv").config();

const ROOT = path.resolve(__dirname, "..");
const STORE_PRODUCTS_PATH = path.join(ROOT, "apps/web/lib/store-products.ts");
const SOURCE = "store-products.ts";
const overwrite = process.argv.includes("--overwrite");

const summary = {
  totalFound: 0,
  created: 0,
  updated: 0,
  skipped: 0,
  duplicatesIgnored: 0,
  errors: 0,
};

function loadTsModule(filePath) {
  const source = fs.readFileSync(filePath, "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
    fileName: filePath,
  }).outputText;

  const mod = new Module(filePath, module.parent);
  mod.filename = filePath;
  mod.paths = Module._nodeModulePaths(path.dirname(filePath));
  mod._compile(compiled, filePath);
  return mod.exports;
}

function isStoreProductLike(value) {
  return Boolean(
    value &&
      typeof value === "object" &&
      typeof value.slug === "string" &&
      typeof value.name === "string" &&
      typeof value.currentPrice === "string" &&
      typeof value.category === "string",
  );
}

function collectStoreProducts(exports) {
  const candidates = [];
  for (const [name, value] of Object.entries(exports)) {
    if (!Array.isArray(value)) continue;
    const products = value.filter(isStoreProductLike);
    if (!products.length) continue;
    console.log(`Found ${products.length} product(s) in export: ${name}`);
    candidates.push(...products);
  }

  summary.totalFound = candidates.length;
  const bySlug = new Map();
  for (const product of candidates) {
    const slug = product.slug.trim();
    if (bySlug.has(slug)) {
      summary.duplicatesIgnored += 1;
      continue;
    }
    bySlug.set(slug, product);
  }
  return [...bySlug.values()];
}

function parseNprPrice(price) {
  if (typeof price === "number") return Number.isFinite(price) ? price : 0;
  if (!price) return 0;
  const numericPrice = Number(String(price).match(/\d+(?:\.\d+)?/g)?.join("") ?? "");
  return Number.isFinite(numericPrice) ? numericPrice : 0;
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeCategoryName(value) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ");
}

function mapStatus(status) {
  switch (status) {
    case "Low Stock":
      return "low_stock";
    case "Out of Stock":
      return "out_of_stock";
    case "In Stock":
    default:
      return "active";
  }
}

function filenameFromUrl(url) {
  try {
    const parsed = new URL(url, "https://dakshinkali.local");
    return decodeURIComponent(path.basename(parsed.pathname)) || "product-image";
  } catch {
    return path.basename(String(url).split("?")[0]) || "product-image";
  }
}

function makeImageRecord(url, order) {
  return {
    id: globalThis.crypto.randomUUID(),
    url,
    filename: filenameFromUrl(url),
    order,
  };
}

function mapImages(product) {
  const urls = [];
  if (product.image) urls.push(product.image);
  for (const image of product.galleryImages ?? []) {
    if (image?.src) urls.push(image.src);
  }

  return [...new Set(urls.filter(Boolean))].map((url, index) =>
    makeImageRecord(url, index),
  );
}

function descriptionFromProduct(product) {
  if (product.shortDescription) return product.shortDescription;
  const section = product.descriptionSections?.find((item) => item?.body?.length);
  return section?.body?.[0] ?? null;
}

function definedEntries(object) {
  return Object.fromEntries(
    Object.entries(object).filter(([, value]) => value !== undefined),
  );
}

function mapStorefrontData(product, syncedAt) {
  return definedEntries({
    slug: product.slug,
    brand: product.brand,
    shortDescription: product.shortDescription,
    oldPrice: product.oldPrice,
    warranty: product.warranty,
    badge: product.badge,
    badges: product.badges ?? (product.badge ? [product.badge] : undefined),
    collection: product.collection,
    ratingText: product.ratingText,
    isFeatured: product.isFeatured,
    isBestSeller: product.isBestSeller,
    isNewArrival: product.isNewArrival,
    isActive: product.isActive,
    highlights: product.highlights,
    descriptionSections: product.descriptionSections,
    specifications: product.specifications,
    boxContents: product.boxContents,
    deliveryInfo: product.deliveryInfo,
    relatedProductSlugs: product.relatedProductSlugs,
    variants: product.variants,
    searchTerms: product.searchTerms,
    source: SOURCE,
    syncedAt,
    publishingStatus: "live",
  });
}

function mergeMissingStorefrontData(existing, incoming, syncedAt) {
  const merged = { ...(existing ?? {}) };
  for (const [key, value] of Object.entries(incoming)) {
    if (merged[key] === undefined || merged[key] === null || merged[key] === "") {
      merged[key] = value;
    }
  }
  merged.source = merged.source ?? SOURCE;
  merged.syncedAt = merged.syncedAt ?? syncedAt;
  return merged;
}

function hasChange(existing, next) {
  return JSON.stringify(existing ?? null) !== JSON.stringify(next ?? null);
}

async function getOrCreateCategory(supabase, productCategory, cache) {
  const name = normalizeCategoryName(productCategory);
  const slug = slugify(name);
  if (cache.has(slug)) return cache.get(slug);

  const { data: existing, error: findError } = await supabase
    .from("categories")
    .select("id, name, slug")
    .eq("slug", slug)
    .maybeSingle();

  if (findError) throw findError;
  if (existing) {
    cache.set(slug, existing);
    return existing;
  }

  const { data: created, error: createError } = await supabase
    .from("categories")
    .insert({
      name,
      slug,
      description: null,
      is_active: true,
      sort_order: 100,
    })
    .select("id, name, slug")
    .single();

  if (createError) throw createError;
  cache.set(slug, created);
  console.log(`Created category: ${name}`);
  return created;
}

async function findProductBySlug(supabase, slug) {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .is("deleted_at", null)
    .filter("storefront_data->>slug", "eq", slug)
    .maybeSingle();

  if (error) throw error;
  return data;
}

async function syncProduct(supabase, product, categoryCache, syncedAt) {
  const category = await getOrCreateCategory(supabase, product.category, categoryCache);
  const storefrontData = mapStorefrontData(product, syncedAt);
  const images = mapImages(product);
  const baseRow = {
    name: product.name,
    description: descriptionFromProduct(product),
    price: parseNprPrice(product.currentPrice),
    category: category.name,
    category_id: category.id,
    status: mapStatus(product.status),
    publishing_status: "live",
    images,
    storefront_data: storefrontData,
  };

  const existing = await findProductBySlug(supabase, product.slug);
  if (!existing) {
    const { error } = await supabase.from("products").insert(baseRow);
    if (error) throw error;
    summary.created += 1;
    console.log(`created  ${product.slug}`);
    return;
  }

  const existingStorefrontData = existing.storefront_data ?? {};
  const nextStorefrontData = overwrite
    ? { ...existingStorefrontData, ...storefrontData }
    : mergeMissingStorefrontData(existingStorefrontData, storefrontData, syncedAt);

  const patch = {};
  if (overwrite || !existing.name) patch.name = baseRow.name;
  if (overwrite || !existing.description) patch.description = baseRow.description;
  if (overwrite || !Number(existing.price)) patch.price = baseRow.price;
  if (overwrite || !existing.category_id) {
    patch.category = baseRow.category;
    patch.category_id = baseRow.category_id;
  }
  if (overwrite || !existing.status) patch.status = baseRow.status;
  if (overwrite || !existing.publishing_status) {
    patch.publishing_status = baseRow.publishing_status;
  }
  if (overwrite || !Array.isArray(existing.images) || existing.images.length === 0) {
    patch.images = baseRow.images;
  }
  if (hasChange(existingStorefrontData, nextStorefrontData)) {
    patch.storefront_data = nextStorefrontData;
  }

  if (!Object.keys(patch).length) {
    summary.skipped += 1;
    console.log(`skipped  ${product.slug}`);
    return;
  }

  const { error } = await supabase
    .from("products")
    .update(patch)
    .eq("id", existing.id);

  if (error) throw error;
  summary.updated += 1;
  console.log(`updated  ${product.slug}`);
}

async function main() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("Missing SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
    process.exit(1);
  }

  console.log(`Loading ${pathToFileURL(STORE_PRODUCTS_PATH).href}`);
  console.log(`Mode: ${overwrite ? "overwrite known imported fields" : "conservative"}`);

  const exports = loadTsModule(STORE_PRODUCTS_PATH);
  const products = collectStoreProducts(exports);
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const categoryCache = new Map();
  const syncedAt = new Date().toISOString();

  for (const product of products) {
    try {
      await syncProduct(supabase, product, categoryCache, syncedAt);
    } catch (error) {
      summary.errors += 1;
      console.error(`error    ${product.slug}: ${error.message}`);
    }
  }

  console.log("");
  console.log("Sync summary");
  console.log(`total found:        ${summary.totalFound}`);
  console.log(`unique slugs:       ${products.length}`);
  console.log(`created:            ${summary.created}`);
  console.log(`updated:            ${summary.updated}`);
  console.log(`skipped:            ${summary.skipped}`);
  console.log(`duplicates ignored: ${summary.duplicatesIgnored}`);
  console.log(`errors:             ${summary.errors}`);

  if (summary.errors > 0) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
