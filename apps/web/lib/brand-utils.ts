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

export function normalizeBrandParam(input: string | null | undefined) {
  return normalizeBrandName(String(input ?? "").replace(/-/g, " "));
}

export function canonicalBrandDisplayName(input: string | null | undefined) {
  const clean = cleanBrandDisplayName(input);
  if (!clean) return "";
  return PRIORITY_BY_NORMALIZED.get(normalizeBrandName(clean))?.name ?? clean;
}

export function brandSlug(input: string) {
  return normalizeBrandName(input).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export function compareBrandOptions(
  left: { name: string; normalizedName?: string; normalized_name?: string; sortPriority?: number | null; sort_priority?: number | null },
  right: { name: string; normalizedName?: string; normalized_name?: string; sortPriority?: number | null; sort_priority?: number | null },
) {
  const leftNormalized = left.normalizedName ?? left.normalized_name ?? normalizeBrandName(left.name);
  const rightNormalized = right.normalizedName ?? right.normalized_name ?? normalizeBrandName(right.name);
  const leftPriority =
    left.sortPriority ?? left.sort_priority ?? PRIORITY_BY_NORMALIZED.get(leftNormalized)?.sortPriority ?? Number.MAX_SAFE_INTEGER;
  const rightPriority =
    right.sortPriority ?? right.sort_priority ?? PRIORITY_BY_NORMALIZED.get(rightNormalized)?.sortPriority ?? Number.MAX_SAFE_INTEGER;
  if (leftPriority !== rightPriority) return leftPriority - rightPriority;
  return left.name.localeCompare(right.name);
}
