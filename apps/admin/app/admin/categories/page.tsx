import { AdminLayoutShell } from "@/components/admin/admin-layout-shell";
import { CategoriesManager } from "@/components/admin/categories-manager";
import { listCategories } from "@/lib/admin/actions/categories";

export default async function AdminCategoriesPage() {
  const categories = await listCategories(true);

  return (
    <AdminLayoutShell title="Categories">
      <CategoriesManager initialCategories={categories} />
    </AdminLayoutShell>
  );
}
