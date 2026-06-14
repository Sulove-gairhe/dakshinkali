"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { normalizeCouponCode, type CouponRecord } from "@dakshinkali/database";
import { requireAdminUser } from "@/lib/admin/auth-server";
import { COUPONS_SCHEMA_MISSING_MESSAGE } from "@/lib/admin/coupon-errors";
import type { AdminProductRecord, CategoryRecord } from "@/lib/admin/types";

const couponSchema = z
  .object({
    code: z.string().min(2, "Coupon code must be at least 2 characters").max(40),
    description: z.string().max(240).optional().nullable(),
    discount_type: z.enum(["fixed", "percentage"]),
    discount_value: z.number().positive("Discount value must be greater than 0"),
    max_discount_amount: z.number().positive().optional().nullable(),
    is_active: z.boolean(),
    starts_at: z.string().datetime("Start date/time is required"),
    ends_at: z.string().datetime("End date/time is required"),
    applicability_type: z.enum(["all", "categories", "products"]),
    applicable_category_ids: z.array(z.string().uuid()),
    applicable_product_ids: z.array(z.string().uuid()),
    minimum_order_amount: z.number().min(0).optional().nullable(),
    usage_limit: z.number().int().positive().optional().nullable(),
  })
  .superRefine((value, ctx) => {
    if (value.discount_type === "percentage" && value.discount_value > 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["discount_value"],
        message: "Percentage discount must be between 1 and 100",
      });
    }
    if (new Date(value.ends_at) <= new Date(value.starts_at)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["ends_at"],
        message: "End date/time must be after the start date/time",
      });
    }
    if (
      value.applicability_type === "categories" &&
      value.applicable_category_ids.length === 0
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["applicable_category_ids"],
        message: "Select at least one category or choose All products",
      });
    }
    if (
      value.applicability_type === "products" &&
      value.applicable_product_ids.length === 0
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["applicable_product_ids"],
        message: "Select at least one product or choose All products",
      });
    }
  });

export type CouponInput = z.input<typeof couponSchema>;

export async function listCoupons() {
  const { supabase } = await requireAdminUser();
  const { data, error } = await supabase
    .from("coupons")
    .select("*")
    .is("archived_at", null)
    .order("updated_at", { ascending: false });

  if (error) throw mapCouponError(error);
  return (data ?? []).map(mapCoupon);
}

export async function createCoupon(input: CouponInput) {
  const { supabase } = await requireAdminUser();
  const parsed = parseCouponInput(input);

  const { data, error } = await supabase
    .from("coupons")
    .insert(parsed)
    .select()
    .single();

  if (error) throw mapCouponError(error);
  revalidatePath("/admin/coupons");
  return mapCoupon(data);
}

export async function updateCoupon(id: string, input: CouponInput) {
  const { supabase } = await requireAdminUser();
  const parsed = parseCouponInput(input);

  const { data, error } = await supabase
    .from("coupons")
    .update(parsed)
    .eq("id", id)
    .select()
    .single();

  if (error) throw mapCouponError(error);
  revalidatePath("/admin/coupons");
  return mapCoupon(data);
}

export async function toggleCouponActive(id: string, isActive: boolean) {
  const { supabase } = await requireAdminUser();
  const { data, error } = await supabase
    .from("coupons")
    .update({ is_active: isActive })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/admin/coupons");
  return mapCoupon(data);
}

export async function archiveCoupon(id: string) {
  const { supabase } = await requireAdminUser();
  const { error } = await supabase
    .from("coupons")
    .update({ archived_at: new Date().toISOString(), is_active: false })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/coupons");
  return { ok: true };
}

export async function listCouponCategories() {
  const { supabase } = await requireAdminUser();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as CategoryRecord[];
}

export async function listCouponProducts() {
  const { supabase } = await requireAdminUser();
  const { data, error } = await supabase
    .from("products")
    .select("id,name,model_name,sku,category,category_id,price,purchase_price,wholesale_price,stock_quantity,status,publishing_status,images,storefront_data,description,created_at,updated_at,deleted_at")
    .is("deleted_at", null)
    .eq("publishing_status", "live")
    .order("name", { ascending: true })
    .limit(500);

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    ...row,
    price: Number(row.price),
    purchase_price:
      row.purchase_price === null || row.purchase_price === undefined
        ? null
        : Number(row.purchase_price),
    wholesale_price:
      row.wholesale_price === null || row.wholesale_price === undefined
        ? null
        : Number(row.wholesale_price),
    stock_quantity: Number(row.stock_quantity ?? 0),
    images: Array.isArray(row.images) ? row.images : [],
  })) as AdminProductRecord[];
}

function parseCouponInput(input: CouponInput) {
  const normalized = {
    ...input,
    code: normalizeCouponCode(input.code),
    description: input.description?.trim() || null,
    max_discount_amount:
      input.discount_type === "percentage"
        ? input.max_discount_amount ?? null
        : null,
    minimum_order_amount: input.minimum_order_amount ?? null,
    usage_limit: input.usage_limit ?? null,
    applicable_category_ids:
      input.applicability_type === "categories"
        ? input.applicable_category_ids
        : [],
    applicable_product_ids:
      input.applicability_type === "products" ? input.applicable_product_ids : [],
  };

  return couponSchema.parse(normalized);
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

function mapCouponError(error: { code?: string; message: string }) {
  if (
    error.code === "PGRST205" ||
    error.message.includes("public.coupons") ||
    error.message.includes("schema cache")
  ) {
    return new Error(COUPONS_SCHEMA_MISSING_MESSAGE);
  }
  if (error.code === "23505") {
    return new Error("A coupon with this code already exists.");
  }
  if (error.message.includes("coupons_validity_check")) {
    return new Error("End date/time must be after the start date/time.");
  }
  if (error.message.includes("coupons_percentage_value")) {
    return new Error("Percentage discount must be between 1 and 100.");
  }
  return new Error(error.message);
}
