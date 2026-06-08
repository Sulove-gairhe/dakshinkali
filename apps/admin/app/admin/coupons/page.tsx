import { AdminLayoutShell } from "@/components/admin/admin-layout-shell";
import { CouponsManager } from "@/components/admin/coupons-manager";
import { isCouponsSchemaMissing } from "@/lib/admin/coupon-errors";
import {
  listCouponCategories,
  listCouponProducts,
  listCoupons,
} from "@/lib/admin/actions/coupons";

export default async function AdminCouponsPage() {
  const [categories, products] = await Promise.all([
    listCouponCategories(),
    listCouponProducts(),
  ]);
  const couponsResult = await listCoupons()
    .then((coupons) => ({ coupons, setupRequired: false }))
    .catch((error) => {
      if (isCouponsSchemaMissing(error)) {
        return { coupons: [], setupRequired: true };
      }
      throw error;
    });

  return (
    <AdminLayoutShell title="Coupons">
      <CouponsManager
        initialCoupons={couponsResult.coupons}
        categories={categories}
        products={products}
        setupRequired={couponsResult.setupRequired}
      />
    </AdminLayoutShell>
  );
}
