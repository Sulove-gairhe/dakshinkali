import { AdminLayoutShell } from "@/components/admin/admin-layout-shell";
import { BrandsManager } from "@/components/admin/brands-manager";
import { listBrandManagementRecords } from "@/lib/admin/actions/brands";

export default async function AdminBrandsPage() {
  const brands = await listBrandManagementRecords();

  return (
    <AdminLayoutShell title="Brands">
      <BrandsManager initialBrands={brands} />
    </AdminLayoutShell>
  );
}
