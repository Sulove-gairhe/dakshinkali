import { Suspense } from "react";
import { AdminLayoutShell } from "@/components/admin/admin-layout-shell";
import { VirtualizedProductsList } from "@/components/admin/virtualized-products-list";
import { listCategories } from "@/lib/admin/actions/categories";

export default async function AdminProductsPage() {
  const categories = await listCategories(true);

  return (
    <AdminLayoutShell title="Products">
      <Suspense fallback={<p className="text-sm text-gray-500">Loading…</p>}>
        <VirtualizedProductsList categories={categories} />
      </Suspense>
    </AdminLayoutShell>
  );
}
