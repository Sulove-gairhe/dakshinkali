import { AdminNavProvider } from "@/components/admin/admin-nav-provider";
import { AdminQueryProvider } from "@/components/admin/query-provider";
import { getOrderNavCounts } from "@/lib/admin/actions/orders";
import { createClient } from "@/lib/supabase/server";

export default async function AdminSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let counts = { pendingVerification: 0, pendingApproval: 0, awaitingApproval: 0 };
  let role: "admin" | "staff" | "customer" | null = null;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const rolePromise = user
      ? supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle()
      : Promise.resolve({ data: null });

    const [orderCounts, profileResult] = await Promise.all([
      getOrderNavCounts(),
      rolePromise,
    ]);

    counts = orderCounts;
    const nextRole = profileResult.data?.role;
    role =
      nextRole === "admin" || nextRole === "staff" || nextRole === "customer"
        ? nextRole
        : null;
  } catch {
    // Unauthenticated routes still render login outside this layout scope
  }

  return (
    <AdminNavProvider counts={counts} role={role}>
      <AdminQueryProvider>
        {children}
      </AdminQueryProvider>
    </AdminNavProvider>
  );
}
