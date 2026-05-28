import { Suspense } from "react";
import { AdminLayoutShell } from "@/components/admin/admin-layout-shell";
import { ProductsList } from "@/components/admin/products-list";
import { listCategories } from "@/lib/admin/actions/categories";

export default async function AdminProductsPage() {
  const categories = await listCategories(true);

  return (
    <AdminLayoutShell title="Products">
      <Suspense fallback={<p className="text-sm text-gray-500">Loading…</p>}>
        <ProductsList categories={categories} />
      </Suspense>
    </AdminLayoutShell>
  );
}
