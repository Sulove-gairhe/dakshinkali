import { Suspense } from "react";
import { AdminLayoutShell } from "@/components/admin/admin-layout-shell";
import { OrdersList } from "@/components/admin/orders-list";

export default function AdminOrdersPage() {
  return (
    <AdminLayoutShell title="Orders">
      <Suspense fallback={<p className="text-sm text-gray-500">Loading orders…</p>}>
        <OrdersList />
      </Suspense>
    </AdminLayoutShell>
  );
}
