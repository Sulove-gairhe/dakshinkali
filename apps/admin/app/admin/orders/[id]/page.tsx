import { notFound } from "next/navigation";
import { AdminLayoutShell } from "@/components/admin/admin-layout-shell";
import { OrderDetailClient } from "@/components/admin/order-detail-client";
import { getAdminOrder } from "@/lib/admin/actions/orders";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getAdminOrder(id);
  if (!order) notFound();

  return (
    <AdminLayoutShell title={`Order ${order.order_number}`}>
      <OrderDetailClient initialOrder={order} />
    </AdminLayoutShell>
  );
}
