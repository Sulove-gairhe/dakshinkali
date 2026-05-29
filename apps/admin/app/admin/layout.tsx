import { AdminNavProvider } from "@/components/admin/admin-nav-provider";
import { AdminQueryProvider } from "@/components/admin/query-provider";
import { getOrderNavCounts } from "@/lib/admin/actions/orders";
import { getAdminNotificationCounts } from "@/lib/admin/actions/notifications";

export default async function AdminSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let counts = { pendingVerification: 0, pendingApproval: 0 };
  let notifications = {
    pendingVerification: 0,
    pendingApproval: 0,
    outOfStock: 0,
    lowStock: 0,
    total: 0,
  };

  try {
    [counts, notifications] = await Promise.all([
      getOrderNavCounts(),
      getAdminNotificationCounts(),
    ]);
  } catch {
    // Unauthenticated routes still render login outside this layout scope
  }

  return (
    <AdminNavProvider counts={counts} notifications={notifications}>
      <AdminQueryProvider>
        {children}
      </AdminQueryProvider>
    </AdminNavProvider>
  );
}
