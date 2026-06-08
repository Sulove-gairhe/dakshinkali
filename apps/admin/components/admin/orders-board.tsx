"use client";

import { useCallback, useEffect, useState } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";
import { toast } from "sonner";
import Link from "next/link";
import { listBoardOrders, updateOrderStatus } from "@/lib/admin/actions/orders";
import type { AdminOrderRecord, OrderStatus } from "@/lib/admin/order-types";
import { actionErrorMessage } from "@/lib/admin/order-types";
import {
  formatNprPrice,
  isValidOrderTransition,
  paymentMethodLabel,
  canShipOrder,
  orderItemPreview,
  orderStatusLabel,
} from "@/lib/admin/order-utils";

const COLUMNS: { id: OrderStatus; title: string }[] = [
  { id: "pending", title: "Pending" },
  { id: "confirmed", title: "Confirmed" },
  { id: "processing", title: "Processing" },
  { id: "shipped", title: "Shipped" },
  { id: "delivered", title: "Delivered" },
];

export function OrdersBoard() {
  const [orders, setOrders] = useState<AdminOrderRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listBoardOrders();
      setOrders(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't load your orders");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function ordersByStatus(status: OrderStatus) {
    return orders.filter((o) => o.status === status);
  }

  async function onDragEnd(result: DropResult) {
    if (!result.destination) return;
    const orderId = result.draggableId;
    const newStatus = result.destination.droppableId as OrderStatus;
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    if (order.status === newStatus) return;

    if (!isValidOrderTransition(order.status, newStatus)) {
      toast.error(
        `Cannot move order to ${orderStatusLabel(newStatus)} from ${orderStatusLabel(order.status)}`,
      );
      return;
    }

    if (
      newStatus === "shipped" &&
      !canShipOrder(order.payment_status, order.payment_method)
    ) {
      toast.error("Cannot ship — payment has not been verified");
      return;
    }

    const resultAction = await updateOrderStatus(orderId, newStatus);
    if (!resultAction.success) {
      toast.error(actionErrorMessage(resultAction) ?? "Couldn't update the status");
      return;
    }

    toast.success("Order status updated");
    await load();
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-5">
        {COLUMNS.map((col) => (
          <div
            key={col.id}
            className="h-64 animate-pulse rounded-xl bg-gray-200"
          />
        ))}
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={(r) => void onDragEnd(r)}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((column) => (
          <Droppable key={column.id} droppableId={column.id}>
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="w-72 shrink-0 rounded-xl border border-gray-200 bg-gray-50"
              >
                <div className="border-b border-gray-200 px-3 py-2">
                  <h3 className="text-sm font-semibold text-gray-900">
                    {column.title}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {ordersByStatus(column.id).length} orders
                  </p>
                </div>
                <div className="min-h-[200px] space-y-2 p-2">
                  {ordersByStatus(column.id).map((order, index) => {
                    const preview = orderItemPreview(order);
                    return (
                      <Draggable
                        key={order.id}
                        draggableId={order.id}
                        index={index}
                      >
                        {(dragProvided) => (
                        <div
                          ref={dragProvided.innerRef}
                          {...dragProvided.draggableProps}
                          {...dragProvided.dragHandleProps}
                          className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm"
                        >
                          <Link
                            href={`/admin/orders/${order.id}`}
                            className="font-mono text-xs font-semibold text-primary hover:underline"
                          >
                            {order.order_number}
                          </Link>
                          <p className="mt-1 text-sm font-medium text-gray-900">
                            {order.customer_name}
                          </p>
                          <p className="text-sm text-gray-600">
                            {formatNprPrice(order.total)}
                          </p>
                          <p className="mt-2 truncate text-sm font-medium text-gray-900">
                            {preview.title}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            {paymentMethodLabel(order.payment_method)} ·{" "}
                            {preview.detail}
                          </p>
                        </div>
                        )}
                      </Draggable>
                    );
                  })}
                  {provided.placeholder}
                </div>
              </div>
            )}
          </Droppable>
        ))}
      </div>
    </DragDropContext>
  );
}
