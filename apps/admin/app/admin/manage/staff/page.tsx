import { AdminLayoutShell } from "@/components/admin/admin-layout-shell";
import { ManageStaffForm } from "@/components/admin/manage-staff-form";
import { requireSuperAdmin } from "@/lib/admin/auth-server";
import { notFound } from "next/navigation";

export default async function ManageStaffAccessPage() {
  try {
    await requireSuperAdmin();
  } catch {
    notFound();
  }

  return (
    <AdminLayoutShell title="Add Staff">
      <div className="mx-auto w-full max-w-2xl">
        <ManageStaffForm />
      </div>
    </AdminLayoutShell>
  );
}
