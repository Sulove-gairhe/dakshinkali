"use server";

import { requireAdminUser } from "@/lib/admin/auth-server";

export type AdminNotificationCounts = {
  pendingVerification: number;
  pendingApproval: number;
  outOfStock: number;
  lowStock: number;
  total: number;
};

export async function getAdminNotificationCounts(): Promise<AdminNotificationCounts> {
  const { supabase } = await requireAdminUser();

  // TODO: incorporate admin_notification_status once checkout wires it reliably.

  const [pendingVerification, pendingApproval, outOfStock, lowStock] =
    await Promise.all([
      supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("payment_status", "pending_verification"),
      supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending_admin_approval"),
      supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("status", "out_of_stock")
        .is("deleted_at", null),
      supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("status", "low_stock")
        .is("deleted_at", null),
    ]);

  const counts = {
    pendingVerification: pendingVerification.count ?? 0,
    pendingApproval: pendingApproval.count ?? 0,
    outOfStock: outOfStock.count ?? 0,
    lowStock: lowStock.count ?? 0,
  };

  return {
    ...counts,
    total:
      counts.pendingVerification +
      counts.pendingApproval +
      counts.outOfStock +
      counts.lowStock,
  };
}
