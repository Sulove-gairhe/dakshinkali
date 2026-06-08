import { AdminLayoutShell } from "@/components/admin/admin-layout-shell";
import { AwaitingApprovalOrders } from "@/components/admin/awaiting-approval-orders";

export default function AwaitingApprovalPage() {
  return (
    <AdminLayoutShell title="Awaiting Approval">
      <AwaitingApprovalOrders />
    </AdminLayoutShell>
  );
}
