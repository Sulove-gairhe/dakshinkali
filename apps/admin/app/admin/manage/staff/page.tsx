import { AdminLayoutShell } from "@/components/admin/admin-layout-shell";
import { ManageStaffForm } from "@/components/admin/manage-staff-form";
import { requireSuperAdmin } from "@/lib/admin/auth-server";
import { getAdminMembers, type AdminMember } from "@/lib/admin/login-security";
import { notFound } from "next/navigation";

export default async function ManageStaffAccessPage() {
  let members: AdminMember[] = [];

  try {
    await requireSuperAdmin();
    members = await getAdminMembers();
  } catch {
    notFound();
  }

  return (
    <AdminLayoutShell title="Manage Staff Access">
      <div className="mx-auto w-full max-w-6xl">
        <ManageStaffForm members={members} />
      </div>
    </AdminLayoutShell>
  );
}
