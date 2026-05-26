"use client";

import { createContext, useContext } from "react";
import type { AdminNotificationCounts } from "@/lib/admin/actions/notifications";

export type OrderNavCounts = {
  pendingVerification: number;
  pendingApproval: number;
};

export type AdminNavContextValue = OrderNavCounts & {
  notifications: AdminNotificationCounts;
};

const defaultNotifications: AdminNotificationCounts = {
  pendingVerification: 0,
  pendingApproval: 0,
  outOfStock: 0,
  lowStock: 0,
  total: 0,
};

const AdminNavContext = createContext<AdminNavContextValue>({
  pendingVerification: 0,
  pendingApproval: 0,
  notifications: defaultNotifications,
});

export function AdminNavProvider({
  counts,
  notifications,
  children,
}: {
  counts: OrderNavCounts;
  notifications: AdminNotificationCounts;
  children: React.ReactNode;
}) {
  return (
    <AdminNavContext.Provider value={{ ...counts, notifications }}>
      {children}
    </AdminNavContext.Provider>
  );
}

export function useAdminNavCounts() {
  return useContext(AdminNavContext);
}
