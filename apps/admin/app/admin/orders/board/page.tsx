import { AdminLayoutShell } from "@/components/admin/admin-layout-shell";
import { OrdersBoard } from "@/components/admin/orders-board";

export default function OrdersBoardPage() {
  return (
    <AdminLayoutShell title="Fulfillment Board">
      <p className="mb-4 text-sm text-gray-600">
        Drag orders between columns to update fulfillment status. Changes are saved
        after server confirmation.
      </p>
      <OrdersBoard />
    </AdminLayoutShell>
  );
}
