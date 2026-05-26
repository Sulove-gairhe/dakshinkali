import { notFound } from "next/navigation";
import { AdminLayoutShell } from "@/components/admin/admin-layout-shell";
import { OrderDetailClient } from "@/components/admin/order-detail-client";
import { getAdminOrder } from "@/lib/admin/actions/orders";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const order = await getAdminOrder(params.id);
  if (!order) notFound();

  return (
    <AdminLayoutShell title={`Order ${order.order_number}`}>
      <OrderDetailClient initialOrder={order} />
    </AdminLayoutShell>
  );
}
