"use client";

import { createContext, useContext } from "react";

export type OrderNavCounts = {
  pendingVerification: number;
  pendingApproval: number;
  awaitingApproval: number;
};

export type AdminNavContextValue = OrderNavCounts & {
  role: "admin" | "staff" | "customer" | null;
};

const AdminNavContext = createContext<AdminNavContextValue>({
  pendingVerification: 0,
  pendingApproval: 0,
  awaitingApproval: 0,
  role: null,
});

export function AdminNavProvider({
  counts,
  role,
  children,
}: {
  counts: OrderNavCounts;
  role: AdminNavContextValue["role"];
  children: React.ReactNode;
}) {
  return (
    <AdminNavContext.Provider value={{ ...counts, role }}>
      {children}
    </AdminNavContext.Provider>
  );
}

export function useAdminNavCounts() {
  return useContext(AdminNavContext);
}
