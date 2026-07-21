import type { SupabaseClient } from "@supabase/supabase-js";

export type BrandRecord = {
  id: string;
  name: string;
  normalized_name: string;
  sort_priority: number | null;
  is_active: boolean;
  product_count?: number;
};

export type ResolvedBrand = {
  id: string;
  name: string;
  normalizedName: string;
};

export const PRIORITY_BRANDS = [
  { name: "Samsung", normalizedName: "samsung", sortPriority: 1 },
  { name: "Himstar", normalizedName: "himstar", sortPriority: 2 },
  { name: "Godrej", normalizedName: "godrej", sortPriority: 3 },
  { name: "TCL", normalizedName: "tcl", sortPriority: 4 },
  { name: "Whirlpool", normalizedName: "whirlpool", sortPriority: 5 },
  { name: "CG", normalizedName: "cg", sortPriority: 6 },
] as const;

const PRIORITY_BY_NORMALIZED: Map<
  string,
  (typeof PRIORITY_BRANDS)[number]
> = new Map(
  PRIORITY_BRANDS.map((brand) => [brand.normalizedName, brand]),
);

export function cleanBrandDisplayName(input: string | null | undefined) {
  return String(input ?? "").trim().replace(/\s+/g, " ");
}

export function normalizeBrandName(input: string | null | undefined) {
  return cleanBrandDisplayName(input).toLowerCase();
}

const REJECTED_BRAND_CANDIDATES = new Set([
  "button",
  "ceiling",
  "cooler",
  "electric",
  "exhaust",
  "filter",
  "food",
  "grill",
  "heater",
  "humidifier",
  "induction",
  "iron",
  "mixer",
  "remote",
  "rice",
  "solo",
  "table",
  "top",
  "vacuum",
  "w/m",
  "washing",
  "sensor/touch/autoclean",
  "sensor/touch/flat",
  "generic",
]);

export function isRejectedBrandCandidate(input: string | null | undefined) {
  const normalized = normalizeBrandName(input);
  return !normalized || REJECTED_BRAND_CANDIDATES.has(normalized);
}

export function getRejectedBrandReason(input: string | null | undefined) {
  const normalized = normalizeBrandName(input);
  if (!normalized) return "Brand cannot be empty";
  if (normalized === "generic") {
    return "Generic is an unresolved fallback, not a public brand";
  }
  if (REJECTED_BRAND_CANDIDATES.has(normalized)) {
    return "This value looks like an imported product fragment, not a brand";
  }
  return null;
}

export function canonicalBrandDisplayName(input: string | null | undefined) {
  const cleaned = cleanBrandDisplayName(input);
  if (!cleaned) return "";
  return PRIORITY_BY_NORMALIZED.get(normalizeBrandName(cleaned))?.name ?? cleaned;
}

export function getPriorityBrandSort(normalizedName: string) {
  return PRIORITY_BY_NORMALIZED.get(normalizedName)?.sortPriority ?? null;
}

export function sortBrands<T extends { name: string; normalized_name: string; sort_priority: number | null }>(
  brands: T[],
) {
  return [...brands].sort((left, right) => {
    const leftPriority = left.sort_priority ?? Number.MAX_SAFE_INTEGER;
    const rightPriority = right.sort_priority ?? Number.MAX_SAFE_INTEGER;
    if (leftPriority !== rightPriority) return leftPriority - rightPriority;
    return left.name.localeCompare(right.name);
  });
}

export async function listActiveBrands(
  supabase: Pick<SupabaseClient, "from">,
): Promise<BrandRecord[]> {
  const { data, error } = await supabase
    .from("brands")
    .select("id, name, normalized_name, sort_priority, is_active")
    .eq("is_active", true);

  if (error) throw new Error(error.message);
  return sortBrands((data ?? []) as BrandRecord[]);
}

export async function resolveBrand(
  supabase: Pick<SupabaseClient, "from">,
  input: string | null | undefined,
  options: { createIfMissing?: boolean } = {},
): Promise<ResolvedBrand | null> {
  const name = canonicalBrandDisplayName(input);
  const normalizedName = normalizeBrandName(name);
  if (!normalizedName) return null;

  const rejectedReason = getRejectedBrandReason(name);
  if (rejectedReason) {
    throw new Error(rejectedReason);
  }

  const { data: existing, error: findError } = await supabase
    .from("brands")
    .select("id, name, normalized_name")
    .eq("normalized_name", normalizedName)
    .maybeSingle();

  if (findError) throw new Error(findError.message);
  if (existing) {
    return {
      id: existing.id as string,
      name: existing.name as string,
      normalizedName: existing.normalized_name as string,
    };
  }

  if (options.createIfMissing === false) return null;

  const sortPriority = getPriorityBrandSort(normalizedName);
  const { data: created, error: createError } = await supabase
    .from("brands")
    .insert({
      name,
      normalized_name: normalizedName,
      sort_priority: sortPriority,
      is_active: true,
    })
    .select("id, name, normalized_name")
    .single();

  if (!createError && created) {
    return {
      id: created.id as string,
      name: created.name as string,
      normalizedName: created.normalized_name as string,
    };
  }

  if (createError?.code !== "23505") {
    throw new Error(createError?.message ?? "Failed to resolve brand");
  }

  const { data: concurrent, error: concurrentError } = await supabase
    .from("brands")
    .select("id, name, normalized_name")
    .eq("normalized_name", normalizedName)
    .single();

  if (concurrentError || !concurrent) {
    throw new Error(concurrentError?.message ?? "Failed to resolve brand");
  }

  return {
    id: concurrent.id as string,
    name: concurrent.name as string,
    normalizedName: concurrent.normalized_name as string,
  };
}
