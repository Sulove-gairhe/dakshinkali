export type CouponDiscountType = "fixed" | "percentage";
export type CouponApplicabilityType = "all" | "categories" | "products";
export type CouponStatus = "active" | "scheduled" | "expired" | "disabled";

export interface CouponRecord {
  id: string;
  code: string;
  description: string | null;
  discount_type: CouponDiscountType;
  discount_value: number;
  max_discount_amount: number | null;
  is_active: boolean;
  starts_at: string;
  ends_at: string;
  applicability_type: CouponApplicabilityType;
  applicable_category_ids: string[];
  applicable_product_ids: string[];
  minimum_order_amount: number | null;
  usage_limit: number | null;
  used_count: number;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CouponCartItem {
  productId: string;
  categoryId?: string | null;
  lineTotal: number;
}

export interface CouponCalculation {
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
}

export interface CouponValidationSuccess extends CouponCalculation {
  valid: true;
  coupon: CouponRecord;
  code: string;
  message: string;
}

export interface CouponValidationFailure {
  valid: false;
  code: string;
  reason:
    | "not_found"
    | "disabled"
    | "scheduled"
    | "expired"
    | "not_applicable"
    | "minimum_not_met"
    | "usage_limit_reached"
    | "empty_cart";
  message: string;
}

export type CouponValidationResult =
  | CouponValidationSuccess
  | CouponValidationFailure;

export function normalizeCouponCode(code: string) {
  return code.trim().toUpperCase().replace(/\s+/g, "");
}

export function getCouponStatus(
  coupon: Pick<CouponRecord, "is_active" | "starts_at" | "ends_at">,
  now = new Date(),
): CouponStatus {
  if (!coupon.is_active) return "disabled";
  const startsAt = new Date(coupon.starts_at);
  const endsAt = new Date(coupon.ends_at);
  if (startsAt.getTime() > now.getTime()) return "scheduled";
  if (endsAt.getTime() < now.getTime()) return "expired";
  return "active";
}

export function calculateCouponDiscount(
  coupon: Pick<
    CouponRecord,
    "discount_type" | "discount_value" | "max_discount_amount"
  >,
  amount: number,
): CouponCalculation {
  const originalAmount = Math.max(0, roundMoney(amount));
  let discountAmount = 0;

  if (coupon.discount_type === "fixed") {
    discountAmount = coupon.discount_value;
  } else {
    discountAmount = originalAmount * (coupon.discount_value / 100);
    if (coupon.max_discount_amount && coupon.max_discount_amount > 0) {
      discountAmount = Math.min(discountAmount, coupon.max_discount_amount);
    }
  }

  discountAmount = Math.min(originalAmount, Math.max(0, roundMoney(discountAmount)));

  return {
    originalAmount,
    discountAmount,
    finalAmount: roundMoney(originalAmount - discountAmount),
  };
}

export function validateCouponForCart(params: {
  coupon: CouponRecord | null;
  code: string;
  items: CouponCartItem[];
  subtotal: number;
  now?: Date;
}): CouponValidationResult {
  const code = normalizeCouponCode(params.code);
  const coupon = params.coupon;

  if (!coupon) {
    return failure(code, "not_found", "Invalid coupon code.");
  }

  if (params.items.length === 0 || params.subtotal <= 0) {
    return failure(code, "empty_cart", "Add items to your cart before applying a coupon.");
  }

  const status = getCouponStatus(coupon, params.now);
  if (status === "disabled") {
    return failure(code, "disabled", "This coupon is currently disabled.");
  }
  if (status === "scheduled") {
    return failure(code, "scheduled", "This coupon is not active yet.");
  }
  if (status === "expired") {
    return failure(code, "expired", "This coupon has expired.");
  }

  const usageLimit = toFiniteNumber(coupon.usage_limit);
  const usedCount = Math.max(0, toFiniteNumber(coupon.used_count) ?? 0);
  if (usageLimit !== null && usageLimit > 0 && usedCount >= usageLimit) {
    return failure(code, "usage_limit_reached", "This coupon has reached its usage limit.");
  }

  const minimumOrderAmount = toFiniteNumber(coupon.minimum_order_amount);
  const subtotal = Math.max(0, roundMoney(params.subtotal));
  if (minimumOrderAmount !== null && minimumOrderAmount > 0 && subtotal < minimumOrderAmount) {
    return failure(
      code,
      "minimum_not_met",
      `This coupon requires a minimum order of Rs. ${formatNprNumber(minimumOrderAmount)}.`,
    );
  }

  const applicableSubtotal = getApplicableSubtotal(coupon, params.items);
  if (applicableSubtotal <= 0) {
    return failure(
      code,
      "not_applicable",
      "This coupon is not valid for the selected products.",
    );
  }

  const calculation = calculateCouponDiscount(coupon, applicableSubtotal);

  return {
    valid: true,
    coupon,
    code,
    ...calculation,
    message: "Coupon applied successfully.",
  };
}

export function getApplicableSubtotal(
  coupon: Pick<
    CouponRecord,
    "applicability_type" | "applicable_category_ids" | "applicable_product_ids"
  >,
  items: CouponCartItem[],
) {
  if (coupon.applicability_type === "all") {
    return sumItems(items);
  }

  if (coupon.applicability_type === "categories") {
    const categoryIds = new Set(coupon.applicable_category_ids);
    return sumItems(
      items.filter((item) => item.categoryId && categoryIds.has(item.categoryId)),
    );
  }

  const productIds = new Set(coupon.applicable_product_ids);
  return sumItems(items.filter((item) => productIds.has(item.productId)));
}

function failure(
  code: string,
  reason: CouponValidationFailure["reason"],
  message: string,
): CouponValidationFailure {
  return { valid: false, code, reason, message };
}

function sumItems(items: CouponCartItem[]) {
  return roundMoney(
    items.reduce((total, item) => total + Math.max(0, item.lineTotal), 0),
  );
}

function roundMoney(value: number) {
  return Math.round((Number.isFinite(value) ? value : 0) * 100) / 100;
}

function toFiniteNumber(value: number | null | undefined) {
  if (value === null || value === undefined) return null;
  return Number.isFinite(value) ? value : null;
}

function formatNprNumber(value: number) {
  return new Intl.NumberFormat("en-NP", {
    maximumFractionDigits: 0,
  }).format(value);
}
