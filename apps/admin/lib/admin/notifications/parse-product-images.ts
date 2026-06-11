type ProductImageRecord = {
  url?: string;
  order?: number;
};

export function parseProductImages(raw: unknown): ProductImageRecord[] {
  if (!raw) return [];

  try {
    if (Array.isArray(raw)) {
      return raw as ProductImageRecord[];
    }
    if (typeof raw === "string") {
      const parsed = JSON.parse(raw) as unknown;
      return Array.isArray(parsed) ? (parsed as ProductImageRecord[]) : [];
    }
  } catch {
    return [];
  }

  return [];
}

export function getProductThumbnailUrl(raw: unknown): string | null {
  const images = parseProductImages(raw);
  if (images.length === 0) return null;

  const sorted = [...images].sort(
    (a, b) => (Number(a.order) || 0) - (Number(b.order) || 0),
  );
  const url = sorted[0]?.url?.trim();
  return url || null;
}
