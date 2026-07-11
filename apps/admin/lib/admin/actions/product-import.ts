"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdminUser } from "@/lib/admin/auth-server";
import { slugifyProductName } from "@/lib/admin/utils";
import { parseProductImportCsv } from "@/lib/admin/product-import/parse";
import { validateImportRows } from "@/lib/admin/product-import/validate";
import type {
  ProductImportCommitSummary,
  ProductImportPreview,
  ProductImportPreviewRow,
} from "@/lib/admin/product-import/schema";
import type { StorefrontData } from "@/lib/admin/types";

const commitRowSchema = z.object({
  rowNumber: z.number().int().min(2),
  itemName: z.string().min(1).max(200),
  modelName: z.string().nullable(),
  brandGuess: z.string().nullable(),
  categoryGuess: z.string().nullable(),
  salesPrice: z.number().nullable(),
  purchasePrice: z.number().nullable(),
  mrp: z.number().nullable(),
  wholesalePrice: z.number().nullable(),
  quantity: z.number().int(),
  stockValue: z.number().nullable(),
  computedStockValue: z.number().nullable(),
  errors: z.array(z.string()),
  warnings: z.array(z.string()),
  action: z.enum(["create draft", "update draft", "skipped", "error"]),
  existingProductId: z.string().uuid().nullable(),
  valid: z.boolean(),
});

function nullablePositive(value: number | null) {
  return value && value > 0 ? value : null;
}

function placeholderImage() {
  return {
    id: crypto.randomUUID(),
    url: "/images/logo-placeholder.webp",
    filename: "logo-placeholder.webp",
    order: 0,
  };
}

function hasImages(value: unknown) {
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) && parsed.length > 0;
    } catch {
      return false;
    }
  }
  return false;
}

async function getExistingProducts(
  supabase: Awaited<ReturnType<typeof requireAdminUser>>["supabase"],
) {
  const { data, error } = await supabase
    .from("products")
    .select("id, name, model_name, images, storefront_data")
    .is("deleted_at", null);

  if (error) throw new Error(error.message);
  return (data ?? []) as Array<{
    id: string;
    name: string;
    model_name: string | null;
    images?: unknown;
    storefront_data?: StorefrontData | null;
  }>;
}

async function uniqueDraftSlug(
  supabase: Awaited<ReturnType<typeof requireAdminUser>>["supabase"],
  baseValue: string,
  excludeProductId?: string | null,
) {
  const base = slugifyProductName(baseValue) || `imported-product-${Date.now()}`;
  let slug = base;
  let attempt = 1;

  while (attempt <= 100) {
    let query = supabase
      .from("products")
      .select("id")
      .is("deleted_at", null)
      .filter("storefront_data->>slug", "eq", slug)
      .limit(1);

    if (excludeProductId) query = query.neq("id", excludeProductId);

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    if (!data?.length) return slug;

    attempt += 1;
    slug = `${base}-${attempt}`;
  }

  return `${base}-${crypto.randomUUID().slice(0, 8)}`;
}

export async function previewProductImport(formData: FormData): Promise<{
  ok: boolean;
  preview?: ProductImportPreview;
  errors?: string[];
}> {
  const { supabase } = await requireAdminUser();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return { ok: false, errors: ["Upload a CSV file"] };
  }

  const text = await file.text();
  const parsed = parseProductImportCsv(text);
  if (parsed.errors.length > 0) {
    return { ok: false, errors: parsed.errors };
  }

  const existingProducts = await getExistingProducts(supabase);
  const rows = validateImportRows(parsed.rows, existingProducts);

  return {
    ok: true,
    preview: {
      rows,
      summary: {
        createdDraft: rows.filter((row) => row.action === "create draft").length,
        updatedDraft: rows.filter((row) => row.action === "update draft").length,
        skipped: rows.filter((row) => row.action === "skipped").length,
        errors: rows.filter((row) => row.action === "error").length,
        warnings: rows.filter((row) => row.warnings.length > 0).length,
      },
    },
  };
}

export async function commitProductImport(input: {
  rows: ProductImportPreviewRow[];
}): Promise<ProductImportCommitSummary> {
  const { supabase } = await requireAdminUser();
  const parsedRows = z.array(commitRowSchema).parse(input.rows) as ProductImportPreviewRow[];
  const existingProducts = await getExistingProducts(supabase);
  const revalidatedRows = validateImportRows(parsedRows, existingProducts);
  const rows = revalidatedRows.filter((row) => row.valid);
  const summary: ProductImportCommitSummary = {
    createdDraft: 0,
    updatedDraft: 0,
    skipped: revalidatedRows.filter((row) => row.action === "skipped").length,
    errors: revalidatedRows.filter((row) => row.action === "error").length,
    warnings: revalidatedRows.filter((row) => row.warnings.length > 0).length,
    errorRows: revalidatedRows
      .filter((row) => row.action === "error")
      .map((row) => ({
        rowNumber: row.rowNumber,
        itemName: row.itemName,
        messages: row.errors.length ? row.errors : ["Invalid row"],
      })),
  };

  for (const row of rows) {
    try {
      const price = row.salesPrice && row.salesPrice > 0 ? row.salesPrice : 1;
      const existing = row.existingProductId
        ? existingProducts.find((product) => product.id === row.existingProductId)
        : null;
      const previousStorefrontData = existing?.storefront_data ?? {};
      const categoryName = row.categoryGuess || "Imported";
      const slug =
        previousStorefrontData.slug ||
        (await uniqueDraftSlug(supabase, row.modelName || row.itemName, row.existingProductId));
      const storefrontData: StorefrontData = {
        ...previousStorefrontData,
        slug,
        brand: previousStorefrontData.brand || row.brandGuess || "Generic",
        shortDescription:
          previousStorefrontData.shortDescription ||
          `${row.itemName} available at Dakshinkali Electronics`,
        warranty: previousStorefrontData.warranty || "Official warranty",
        oldPrice:
          row.mrp && row.mrp > 0
            ? `Rs. ${Math.round(row.mrp).toLocaleString("en-NP")}`
            : undefined,
        publishingStatus: "draft",
        searchTerms: [
          row.itemName,
          row.modelName,
          row.brandGuess,
          categoryName,
          ...(previousStorefrontData.searchTerms ?? []),
        ].filter((term, index, list): term is string =>
          Boolean(term && list.indexOf(term) === index),
        ),
        source: "csv-stock-import",
        syncedAt: new Date().toISOString(),
      };
      if (!storefrontData.oldPrice) delete storefrontData.oldPrice;

      const payload: Record<string, unknown> = {
        name: row.itemName,
        model_name: row.modelName,
        purchase_price: row.purchasePrice,
        wholesale_price: nullablePositive(row.wholesalePrice),
        stock_quantity: row.quantity,
        category: categoryName,
        category_id: null,
        status: "active",
        price,
        publishing_status: "draft",
        storefront_data: storefrontData,
      };
      if (existing && !hasImages(existing.images)) {
        payload.images = [placeholderImage()];
      }

      if (row.action === "update draft" && row.existingProductId) {
        const { error } = await supabase
          .from("products")
          .update(payload)
          .eq("id", row.existingProductId);
        if (error) throw new Error(error.message);
        summary.updatedDraft += 1;
      } else {
        const { error } = await supabase.from("products").insert({
          ...payload,
          images: [placeholderImage()],
          description: null,
          sku: null,
        });
        if (error) throw new Error(error.message);
        summary.createdDraft += 1;
      }
    } catch (error) {
      summary.errors += 1;
      summary.errorRows.push({
        rowNumber: row.rowNumber,
        itemName: row.itemName,
        messages: [error instanceof Error ? error.message : "Import failed"],
      });
    }
  }

  summary.skipped = revalidatedRows.filter((row) => row.action === "skipped").length;
  revalidatePath("/admin/products");
  return summary;
}
