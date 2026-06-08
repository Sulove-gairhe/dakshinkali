"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Bell, Eye } from "lucide-react";
import { toast } from "sonner";
import { ListTableSkeleton } from "./list-table-skeleton";
import {
  formatNprPrice,
  formatRelativeTime,
  orderItemPreview,
  orderStatusBadgeClass,
  orderStatusLabel,
  paymentMethodLabel,
  paymentStatusBadgeClass,
  paymentStatusLabel,
} from "@/lib/admin/utils";
import {
  listAdminOrders,
  quickConfirmCod,
} from "@/lib/admin/actions/orders";
import type { AdminOrderRecord, OrderStatus, PaymentMethod, PaymentStatus } from "@/lib/admin/order-types";
import { actionErrorMessage } from "@/lib/admin/order-types";

export function OrdersList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<AdminOrderRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 25;

  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const [status, setStatus] = useState(searchParams.get("status") ?? "");
  const [paymentStatus, setPaymentStatus] = useState(
    searchParams.get("paymentStatus") ?? "",
  );
  const [paymentMethod, setPaymentMethod] = useState(
    searchParams.get("paymentMethod") ?? "",
  );

  useEffect(() => {
    setStatus(searchParams.get("status") ?? "");
    setPaymentStatus(searchParams.get("paymentStatus") ?? "");
    setPaymentMethod(searchParams.get("paymentMethod") ?? "");
    setSearch(searchParams.get("q") ?? "");
  }, [searchParams]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await listAdminOrders({
        search: search || undefined,
        status: (status as OrderStatus) || undefined,
        paymentStatus: (paymentStatus as PaymentStatus) || undefined,
        paymentMethod:
          (paymentMethod as PaymentMethod | "fonepay_qr_group") || undefined,
        page,
        pageSize,
      });
      setOrders(result.orders);
      setTotal(result.total);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't load your orders");
    } finally {
      setLoading(false);
    }
  }, [search, status, paymentStatus, paymentMethod, page]);

  useEffect(() => {
    const timer = setTimeout(() => void load(), 300);
    return () => clearTimeout(timer);
  }, [load]);

  async function handleQuickCod(orderId: string) {
    const result = await quickConfirmCod(orderId);
    if (!result.success) {
      toast.error(actionErrorMessage(result) ?? "Couldn't confirm this order");
      return;
    }
    toast.success("COD order confirmed");
    await load();
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const hasFilters = !!(search || status || paymentStatus || paymentMethod);

  return (
    <>
      <div className="mb-4 flex flex-wrap gap-2">
        <input
          type="search"
          placeholder="Search order #, name, email, phone…"
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
          className="min-w-[220px] flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm md:max-w-sm"
        />
        <select
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value);
          }}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          {[
            "pending",
            "pending_admin_approval",
            "confirmed",
            "processing",
            "shipped",
            "delivered",
            "cancelled",
          ].map((s) => (
            <option key={s} value={s}>
              {orderStatusLabel(s as OrderStatus)}
            </option>
          ))}
        </select>
        <select
          value={paymentStatus}
          onChange={(e) => {
            setPage(1);
            setPaymentStatus(e.target.value);
          }}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
        >
          <option value="">All payment statuses</option>
          {["pending", "pending_verification", "paid", "failed", "refunded"].map(
            (s) => (
              <option key={s} value={s}>
                {paymentStatusLabel(s as PaymentStatus)}
              </option>
            ),
          )}
        </select>
        <select
          value={paymentMethod}
          onChange={(e) => {
            setPage(1);
            setPaymentMethod(e.target.value);
          }}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
        >
          <option value="">All payment methods</option>
          <option value="cash_on_delivery">Cash on Delivery</option>
          <option value="fonepay_qr_group">Fonepay / QR Payment</option>
        </select>
      </div>

      {loading ? (
        <ListTableSkeleton rows={6} />
      ) : orders.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center">
          <p className="text-gray-600">
            {hasFilters ? "No orders found" : "No orders yet"}
          </p>
          {hasFilters ? (
            <button
              type="button"
              className="mt-3 text-sm text-primary hover:underline"
              onClick={() => {
                setSearch("");
                setStatus("");
                setPaymentStatus("");
                setPaymentMethod("");
                setPage(1);
              }}
            >
              Reset filters
            </button>
          ) : null}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Order #</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Items</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Pay status</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const preview = orderItemPreview(order);
                const highlightProof =
                  order.payment_status === "pending_verification";
                const highlightApproval =
                  order.status === "pending_admin_approval";
                const showQuickCod =
                  order.payment_method === "cash_on_delivery" &&
                  order.status === "pending_admin_approval";

                return (
                  <tr
                    key={order.id}
                    onClick={() => router.push(`/admin/orders/${order.id}`)}
                    className={`cursor-pointer border-t border-gray-100 transition hover:bg-gray-50/80 ${
                      highlightProof || highlightApproval
                        ? "border-l-4 border-l-primary bg-primary/5"
                        : ""
                    }`}
                  >
                    <td className="px-4 py-3 font-mono text-xs font-medium">
                      {order.order_number}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{order.customer_name}</p>
                      <p className="text-xs text-gray-500">
                        {order.customer_email}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="max-w-[220px] truncate font-medium text-gray-900">
                        {preview.title}
                      </p>
                      <p className="text-xs text-gray-500">{preview.detail}</p>
                    </td>
                    <td className="px-4 py-3">{formatNprPrice(order.total)}</td>
                    <td className="px-4 py-3">
                      <span className="rounded bg-gray-100 px-2 py-0.5 text-xs">
                        {paymentMethodLabel(order.payment_method)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${orderStatusBadgeClass(order.status)}`}
                      >
                        {order.status === "pending_admin_approval" ? (
                          <Bell className="h-3 w-3" />
                        ) : null}
                        {orderStatusLabel(order.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${paymentStatusBadgeClass(order.payment_status)}`}
                      >
                        {paymentStatusLabel(order.payment_status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {formatRelativeTime(order.created_at)}
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-2">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="text-primary hover:text-primary"
                          title="View"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        {showQuickCod ? (
                          <button
                            type="button"
                            onClick={() => void handleQuickCod(order.id)}
                            className="text-xs font-medium text-green-700 hover:underline"
                          >
                            Confirm COD
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3 text-xs text-gray-600">
            <span>
              {total} order{total === 1 ? "" : "s"}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded border border-gray-200 px-2 py-1 disabled:opacity-40"
              >
                Previous
              </button>
              <span>
                Page {page} / {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded border border-gray-200 px-2 py-1 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

    </>
  );
}
