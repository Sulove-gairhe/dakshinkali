import { NextResponse } from "next/server";
import {
  normalizeCouponCode,
  validateCouponForCart,
  type CouponCartItem,
  type CouponRecord,
} from "@dakshinkali/database";
import { createClient } from "@/lib/supabase/server";

interface ApplyCouponRequest {
  code?: string;
  items?: Array<{
    productId?: string;
    productSlug?: string | null;
    productName?: string | null;
    categoryId?: string | null;
    categoryName?: string | null;
    quantity?: number;
    unitPrice?: number;
  }>;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ApplyCouponRequest;
    const code = normalizeCouponCode(body.code ?? "");

    if (!code) {
      return NextResponse.json(
        { valid: false, code, message: "Enter a coupon code." },
        { status: 400 },
      );
    }

    const items = (body.items ?? [])
      .map((item) => ({
        productId: item.productId ?? "",
        productSlug: item.productSlug ?? null,
        productName: item.productName ?? null,
        categoryId: item.categoryId ?? null,
        categoryName: item.categoryName ?? null,
        quantity: Number(item.quantity) || 0,
        unitPrice: Number(item.unitPrice) || 0,
      }))
      .filter((item) => item.productId && item.quantity > 0 && item.unitPrice > 0);

    const supabase = await createClient();
    const { data: couponRow, error } = await supabase
      .from("coupons")
      .select("*")
      .eq("code", code)
      .is("archived_at", null)
      .maybeSingle();

    if (error) {
      if (isSchemaCacheMissing(error)) {
        return NextResponse.json(
          {
            valid: false,
            code,
            message:
              "Coupons are not available yet. Please try again after the store updates this feature.",
          },
          { status: 503 },
        );
      }
      return NextResponse.json(
        { valid: false, code, message: "Unable to check this coupon right now." },
        { status: 500 },
      );
    }

    const enrichedItems = await enrichCategoryIds(
      supabase,
      items.map((item) => ({
        productId: item.productId,
        productSlug: item.productSlug,
        productName: item.productName,
        categoryId: item.categoryId,
        categoryName: item.categoryName,
        lineTotal: item.unitPrice * item.quantity,
      })),
    );

    const subtotal = enrichedItems.reduce((total, item) => total + item.lineTotal, 0);
    const result = validateCouponForCart({
      coupon: couponRow ? mapCoupon(couponRow) : null,
      code,
      items: enrichedItems,
      subtotal,
    });

    return NextResponse.json(result, { status: result.valid ? 200 : 400 });
  } catch (error) {
    return NextResponse.json(
      {
        valid: false,
        code: "",
        message:
          error instanceof Error
            ? error.message
            : "Unable to apply coupon. Please try again.",
      },
      { status: 500 },
    );
  }
}

async function enrichCategoryIds(
  supabase: Awaited<ReturnType<typeof createClient>>,
  items: Array<
    CouponCartItem & {
      productSlug?: string | null;
      productName?: string | null;
      categoryName?: string | null;
    }
  >,
) {
  const uuidProductIds = items
    .filter((item) => isUuid(item.productId))
    .map((item) => item.productId);
  const productSlugs = Array.from(
    new Set(
      items
        .map((item) => item.productSlug?.trim())
        .filter((slug): slug is string => Boolean(slug)),
    ),
  );
  const productNames = Array.from(
    new Set(
      items
        .map((item) => item.productName?.trim())
        .filter((name): name is string => Boolean(name)),
    ),
  );
  const categoryNames = Array.from(
    new Set(
      items
        .filter((item) => !item.categoryId && item.categoryName?.trim())
        .map((item) => item.categoryName!.trim()),
    ),
  );

  if (
    uuidProductIds.length === 0 &&
    productSlugs.length === 0 &&
    productNames.length === 0 &&
    categoryNames.length === 0
  ) {
    return items;
  }

  const [productIdResult, productCatalogResult, categoryResult] = await Promise.all([
    uuidProductIds.length > 0
      ? supabase
          .from("products")
          .select("id,category_id,storefront_data,name")
          .in("id", uuidProductIds)
      : Promise.resolve({ data: [] }),
    productSlugs.length > 0 || productNames.length > 0
      ? supabase
          .from("products")
          .select("id,category_id,storefront_data,name")
          .eq("publishing_status", "live")
          .is("deleted_at", null)
          .limit(1000)
      : Promise.resolve({ data: [] }),
    categoryNames.length > 0
      ? supabase.from("categories").select("id,name,slug").in("name", categoryNames)
      : Promise.resolve({ data: [] }),
  ]);

  const productById = new Map<string, ResolvedProduct>();
  const productBySlug = new Map<string, ResolvedProduct>();
  const productByName = new Map<string, ResolvedProduct>();
  const requestedSlugs = new Set(productSlugs.map(normalizeProductKey));
  const requestedNames = new Set(productNames.map(normalizeProductKey));

  for (const row of [
    ...(productIdResult.data ?? []),
    ...(productCatalogResult.data ?? []),
  ]) {
    const product = mapResolvedProduct(row);
    if (!product) continue;
    productById.set(product.id, product);

    if (product.slug) {
      const slugKey = normalizeProductKey(product.slug);
      if (requestedSlugs.has(slugKey)) productBySlug.set(slugKey, product);
    }

    const nameKey = normalizeProductKey(product.name);
    if (requestedNames.has(nameKey)) productByName.set(nameKey, product);
  }

  const categoryByNameOrSlug = new Map(
    (categoryResult.data ?? []).flatMap((row) => [
      [normalizeCategoryKey(row.name as string), row.id as string],
      [normalizeCategoryKey(row.slug as string), row.id as string],
    ]),
  );

  return items.map((item) => ({
    ...item,
    productId:
      productById.get(item.productId)?.id ??
      (item.productSlug
        ? productBySlug.get(normalizeProductKey(item.productSlug))?.id
        : null) ??
      (item.productName
        ? productByName.get(normalizeProductKey(item.productName))?.id
        : null) ??
      item.productId,
    categoryId:
      item.categoryId ??
      productById.get(item.productId)?.categoryId ??
      (item.productSlug
        ? productBySlug.get(normalizeProductKey(item.productSlug))?.categoryId
        : null) ??
      (item.productName
        ? productByName.get(normalizeProductKey(item.productName))?.categoryId
        : null) ??
      (item.categoryName
        ? categoryByNameOrSlug.get(normalizeCategoryKey(item.categoryName))
        : null) ??
      null,
  }));
}

type ResolvedProduct = {
  id: string;
  categoryId: string | null;
  name: string;
  slug: string | null;
};

function mapResolvedProduct(row: any): ResolvedProduct | null {
  if (!row?.id) return null;
  const storefrontData = row.storefront_data;
  const slug =
    storefrontData &&
    typeof storefrontData === "object" &&
    typeof storefrontData.slug === "string"
      ? storefrontData.slug
      : null;

  return {
    id: row.id as string,
    categoryId: (row.category_id as string | null) ?? null,
    name: String(row.name ?? ""),
    slug,
  };
}

function mapCoupon(row: any): CouponRecord {
  return {
    ...row,
    discount_value: toRequiredNumber(row.discount_value),
    max_discount_amount: toOptionalNumber(row.max_discount_amount),
    minimum_order_amount: toOptionalNumber(row.minimum_order_amount),
    usage_limit: toOptionalNumber(row.usage_limit),
    used_count: toRequiredNumber(row.used_count),
    applicable_category_ids: row.applicable_category_ids ?? [],
    applicable_product_ids: row.applicable_product_ids ?? [],
  };
}

function toOptionalNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function toRequiredNumber(value: unknown) {
  const numberValue = Number(value ?? 0);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function normalizeCategoryKey(value: string) {
  return value.trim().toLowerCase().replace(/&/g, "and").replace(/\s+/g, "-");
}

function normalizeProductKey(value: string) {
  return normalizeCategoryKey(value);
}

function isSchemaCacheMissing(error: { code?: string; message?: string }) {
  return (
    error.code === "PGRST205" ||
    error.message?.includes("public.coupons") ||
    error.message?.includes("schema cache")
  );
}
