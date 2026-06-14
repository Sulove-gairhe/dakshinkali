import { AdminLayoutShell } from "@/components/admin/admin-layout-shell";
import { ProductImportForm } from "@/components/admin/product-import-form";

export default async function ProductImportPage() {
  return (
    <AdminLayoutShell title="Import Products">
      <ProductImportForm />
    </AdminLayoutShell>
  );
}
