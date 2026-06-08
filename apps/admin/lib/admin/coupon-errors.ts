export const COUPONS_SCHEMA_MISSING_MESSAGE =
  "Coupon database table is not available yet. Apply supabase/migrations/20260607000000_create_coupons.sql, then reload this page.";

export function isCouponsSchemaMissing(error: unknown) {
  return (
    error instanceof Error &&
    error.message === COUPONS_SCHEMA_MISSING_MESSAGE
  );
}
