import { AdminLayoutShell } from "@/components/admin/admin-layout-shell";
import { BrandsManager } from "@/components/admin/brands-manager";
import { listBrandManagementRecords } from "@/lib/admin/actions/brands";

export default async function AdminBrandsPage() {
  let brands = [];
  let setupError: string | null = null;

  try {
    brands = await listBrandManagementRecords();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load brands";
    if (message.includes("public.brands") || message.includes("schema cache")) {
      setupError = "The brands database migration has not been applied to this Supabase project yet.";
    } else {
      throw error;
    }
  }

  return (
    <AdminLayoutShell title="Brands">
      {setupError ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
          <h2 className="text-lg font-semibold">Brand management is not initialized</h2>
          <p className="mt-2 text-sm">{setupError}</p>
          <p className="mt-3 text-sm">Apply <code className="rounded bg-amber-100 px-1.5 py-0.5">supabase/migrations/20260718000000_create_brands_table.sql</code>, refresh the schema cache, and reload this page.</p>
        </div>
      ) : (
        <BrandsManager initialBrands={brands} />
      )}
    </AdminLayoutShell>
  );
}
