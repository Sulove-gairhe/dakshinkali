"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Bell } from "lucide-react";
import { toast } from "sonner";
import { AdminDrawer } from "./admin-drawer";
import { ConfirmModal } from "./confirm-modal";
import { OrderProofViewer } from "./order-proof-viewer";
import { getProductQuickView } from "@/lib/admin/actions/command-search";
import {
  approveOrderPayment,
  cancelCodOrder,
  confirmCodOrder,
  rejectOrderPayment,
  updateOrderStatus,
} from "@/lib/admin/actions/orders";
import type { AdminOrderRecord, OrderStatus } from "@/lib/admin/order-types";
import {
  canShipOrder,
  formatFileSize,
  formatNprPrice,
  formatRelativeTime,
  formatShippingAddress,
  getValidNextStatuses,
  orderStatusBadgeClass,
  paymentMethodLabel,
  paymentStatusBadgeClass,
} from "@/lib/admin/utils";
import { shippingAddressFromOrder } from "@/lib/admin/order-utils";

type ConfirmAction =
  | { type: "approve" }
  | { type: "reject" }
  | { type: "confirmCod" }
  | { type: "cancelCod" }
  | { type: "status"; status: OrderStatus };

export function OrderDetailClient({
  initialOrder,
}: {
  initialOrder: AdminOrderRecord;
}) {
  const router = useRouter();
  const [order, setOrder] = useState(initialOrder);
  const [adminNote, setAdminNote] = useState(order.admin_notes ?? "");
  const [mobileTab, setMobileTab] = useState<"details" | "proof">("details");
  const [confirm, setConfirm] = useState<ConfirmAction | null>(null);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [productDrawer, setProductDrawer] = useState<{
    id: string;
    name: string;
    price: number;
    status: string;
    category: string;
    brand: string | null;
    imageUrl: string | null;
  } | null>(null);
  const [productLoading, setProductLoading] = useState(false);

  const isProofReview = order.payment_status === "pending_verification";
  const isCodApproval =
    order.payment_method === "cash_on_delivery" &&
    order.status === "pending_admin_approval";

  const items = order.order_items ?? [];
  const history = order.order_status_history ?? [];
  const address = formatShippingAddress(shippingAddressFromOrder(order));

  async function refresh() {
    router.refresh();
  }

  async function openProductQuickView(productId: string | null) {
    if (!productId) return;
    setProductLoading(true);
    setProductDrawer(null);
    try {
      const data = await getProductQuickView(productId);
      if (!data) {
        toast.error("Product not found");
        return;
      }
      setProductDrawer(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load product");
    } finally {
      setProductLoading(false);
    }
  }

  async function runConfirmAction() {
    if (!confirm) return;
    setBusy(true);
    let result;
    switch (confirm.type) {
      case "approve":
        result = await approveOrderPayment(order.id, adminNote);
        break;
      case "reject":
        result = await rejectOrderPayment(order.id, adminNote);
        break;
      case "confirmCod":
        result = await confirmCodOrder(order.id);
        break;
      case "cancelCod":
        result = await cancelCodOrder(order.id, adminNote);
        break;
      case "status":
        result = await updateOrderStatus(order.id, confirm.status, adminNote);
        break;
    }
    setBusy(false);
    setConfirm(null);
    setStatusModalOpen(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }
    setOrder({ ...order, ...result.data, order_items: items, order_status_history: history });
    toast.success("Order updated");
    await refresh();
  }

  const validNext = getValidNextStatuses(order.status);

  function orderDetailsPanel() {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-mono text-lg font-semibold">{order.order_number}</h2>
          <span
            className={`rounded-full px-2 py-0.5 text-xs ${orderStatusBadgeClass(order.status)}`}
          >
            {order.status === "pending_admin_approval" && (
              <Bell className="mr-1 inline h-3 w-3" />
            )}
            {order.status.replace(/_/g, " ")}
          </span>
          <span
            className={`rounded-full px-2 py-0.5 text-xs ${paymentStatusBadgeClass(order.payment_status)}`}
          >
            {order.payment_status}
          </span>
        </div>

        <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900">Customer</h3>
          <p className="mt-2 font-medium">{order.customer_name}</p>
          <p className="text-sm text-gray-600">{order.customer_email}</p>
          {order.customer_phone ? (
            <a
              href={`tel:${order.customer_phone}`}
              className="mt-1 inline-block text-sm text-primary hover:underline"
            >
              {order.customer_phone}
            </a>
          ) : null}
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900">Shipping address</h3>
          <pre className="mt-2 whitespace-pre-wrap font-sans text-sm text-gray-700">
            {address}
          </pre>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm overflow-x-auto">
          <h3 className="mb-3 text-sm font-semibold text-gray-900">Items</h3>
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500">
                <th className="pb-2">Product</th>
                <th className="pb-2">Qty</th>
                <th className="pb-2">Unit</th>
                <th className="pb-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-t border-gray-100">
                  <td className="py-2">
                    <div className="flex items-center gap-2">
                      {item.product_image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.product_image_url}
                          alt=""
                          className="h-10 w-10 rounded object-cover"
                        />
                      ) : null}
                      {item.product_id ? (
                        <button
                          type="button"
                          onClick={() => void openProductQuickView(item.product_id)}
                          className="text-left font-medium text-primary hover:underline"
                        >
                          {item.product_name}
                        </button>
                      ) : (
                        <span>{item.product_name}</span>
                      )}
                    </div>
                  </td>
                  <td className="py-2">{item.quantity}</td>
                  <td className="py-2">{formatNprPrice(item.unit_price)}</td>
                  <td className="py-2">{formatNprPrice(item.total_price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4 space-y-1 border-t border-gray-100 pt-3 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatNprPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping</span>
              <span>{formatNprPrice(order.shipping_cost)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax</span>
              <span>{formatNprPrice(order.tax)}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>{formatNprPrice(order.total)}</span>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm text-sm">
          <p>
            <span className="text-gray-500">Payment method:</span>{" "}
            {paymentMethodLabel(order.payment_method)}
          </p>
          {order.proof_file_name ? (
            <div className="mt-2 space-y-1 text-gray-600">
              <p>Proof: {order.proof_file_name}</p>
              <p>Type: {order.proof_file_type ?? "—"}</p>
              <p>Size: {formatFileSize(order.proof_file_size ?? 0)}</p>
              <p>
                Uploaded:{" "}
                {order.proof_uploaded_at
                  ? formatRelativeTime(order.proof_uploaded_at)
                  : "—"}
              </p>
            </div>
          ) : null}
        </section>

        <div>
          <label className="text-sm font-medium text-gray-700">Internal note</label>
          <textarea
            rows={3}
            value={adminNote}
            onChange={(e) => setAdminNote(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            placeholder="Optional admin note"
          />
        </div>

        {renderActions()}
      </div>
    );
  }

  function renderActions() {
    if (isProofReview) {
      return (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => setConfirm({ type: "approve" })}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            Verify Payment & Confirm Order
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => setConfirm({ type: "reject" })}
            className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
          >
            Reject Payment & Cancel Order
          </button>
        </div>
      );
    }

    if (isCodApproval) {
      return (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => setConfirm({ type: "confirmCod" })}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white"
          >
            Confirm COD Order
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => setConfirm({ type: "cancelCod" })}
            className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700"
          >
            Cancel Order
          </button>
        </div>
      );
    }

    return (
      <div>
        <button
          type="button"
          onClick={() => setStatusModalOpen(true)}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Update Status
        </button>
      </div>
    );
  }

  if (isProofReview) {
    return (
      <>
        <div className="lg:hidden mb-4 flex gap-2">
          {(["details", "proof"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setMobileTab(tab)}
              className={
                mobileTab === tab
                  ? "flex-1 rounded-lg bg-primary/10 py-2 text-sm font-medium"
                  : "flex-1 rounded-lg border border-gray-200 py-2 text-sm"
              }
            >
              {tab === "details" ? "Order Details" : "Payment Proof"}
            </button>
          ))}
        </div>

        <div className="lg:grid lg:grid-cols-5 lg:gap-6">
          <div
            className={`lg:col-span-3 ${mobileTab === "proof" ? "hidden lg:block" : ""}`}
          >
            {orderDetailsPanel()}
          </div>
          <div
            className={`lg:col-span-2 lg:sticky lg:top-20 lg:self-start ${mobileTab === "details" ? "hidden lg:block" : ""}`}
          >
            <OrderProofViewer
              orderId={order.id}
              proofUrl={order.proof_file_url}
              proofType={order.proof_file_type}
              onUploaded={() => void refresh()}
            />
          </div>
        </div>
        {confirmModal()}
        {statusUpdateModal()}
        {productQuickViewDrawer()}
      </>
    );
  }

  return (
    <div className="max-w-3xl">
      {orderDetailsPanel()}
      {!isCodApproval && !isProofReview ? (
        <section className="mt-8 rounded-xl border border-gray-200 bg-white p-4">
          <h3 className="text-sm font-semibold">Status timeline</h3>
          <ul className="mt-3 space-y-2">
            {history.map((entry) => (
              <li key={entry.id} className="text-sm text-gray-600">
                <span className="font-medium text-gray-900">{entry.status}</span>
                {" · "}
                {formatRelativeTime(entry.created_at)}
                {entry.notes ? ` — ${entry.notes}` : ""}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {confirmModal()}
      {statusUpdateModal()}
      {productQuickViewDrawer()}
    </div>
  );

  function productQuickViewDrawer() {
    return (
      <AdminDrawer
        open={!!productDrawer || productLoading}
        onClose={() => {
          setProductDrawer(null);
          setProductLoading(false);
        }}
        title="Product quick view"
        width="md"
      >
        {productLoading ? (
          <p className="text-sm text-gray-500">Loading…</p>
        ) : productDrawer ? (
          <div className="space-y-4 text-sm">
            {productDrawer.imageUrl ? (
              <div className="aspect-square max-w-[200px] overflow-hidden rounded-lg border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={productDrawer.imageUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </div>
            ) : null}
            <p className="font-heading text-lg font-semibold">
              {productDrawer.name}
            </p>
            <p>{formatNprPrice(productDrawer.price)}</p>
            <p>
              <span className="text-gray-500">Status: </span>
              {productDrawer.status}
            </p>
            {productDrawer.brand ? (
              <p>
                <span className="text-gray-500">Brand: </span>
                {productDrawer.brand}
              </p>
            ) : null}
            <p>
              <span className="text-gray-500">Category: </span>
              {productDrawer.category}
            </p>
            <Link
              href={`/admin/products/${productDrawer.id}/edit`}
              className="inline-block rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
              onClick={() => setProductDrawer(null)}
            >
              Edit product
            </Link>
          </div>
        ) : null}
      </AdminDrawer>
    );
  }

  function confirmModal() {
    const copy = {
      approve: {
        title: "Verify payment?",
        description:
          "This marks payment as paid and confirms the order. The customer will proceed to fulfillment.",
      },
      reject: {
        title: "Reject payment?",
        description:
          "This cancels the order and marks payment as failed. Proof cleanup will be scheduled.",
      },
      confirmCod: {
        title: "Confirm COD order?",
        description:
          "The order will be confirmed. Payment remains pending until delivery.",
      },
      cancelCod: {
        title: "Cancel order?",
        description: "This cancels the COD order.",
      },
      status: {
        title: `Change status to ${confirm && "status" in confirm ? confirm.status : ""}?`,
        description: "This updates the order fulfillment status.",
      },
    };

    if (!confirm) return null;
    const key =
      confirm.type === "status" ? "status" : confirm.type;
    const c = copy[key as keyof typeof copy];

    return (
      <ConfirmModal
        open
        title={c.title}
        description={c.description}
        confirmLabel="Confirm"
        onCancel={() => setConfirm(null)}
        onConfirm={() => void runConfirmAction()}
      />
    );
  }

  function statusUpdateModal() {
    if (!statusModalOpen) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <button
          type="button"
          className="absolute inset-0 bg-black/40"
          onClick={() => setStatusModalOpen(false)}
        />
        <div className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
          <h3 className="text-lg font-semibold">Update status</h3>
          <p className="mt-1 text-sm text-gray-600">
            Current: {order.status.replace(/_/g, " ")}
          </p>
          <div className="mt-4 space-y-2">
            {validNext.map((next) => {
              const shipBlocked =
                next === "shipped" &&
                !canShipOrder(order.payment_status, order.payment_method);
              return (
                <button
                  key={next}
                  type="button"
                  disabled={shipBlocked || busy}
                  title={
                    shipBlocked
                      ? "Cannot ship — payment not verified"
                      : undefined
                  }
                  onClick={() => setConfirm({ type: "status", status: next })}
                  className="block w-full rounded-lg border border-gray-200 px-3 py-2 text-left text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {next.replace(/_/g, " ")}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            className="mt-4 w-full rounded-lg border border-gray-200 py-2 text-sm"
            onClick={() => setStatusModalOpen(false)}
          >
            Close
          </button>
        </div>
      </div>
    );
  }
}
