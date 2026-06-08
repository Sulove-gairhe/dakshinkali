"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  Search,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { ConfirmModal } from "./confirm-modal";
import { ListTableSkeleton } from "./list-table-skeleton";
import {
  approveOrderPayment,
  cancelCodOrder,
  confirmCodOrder,
  getAwaitingApprovalSummary,
  listAwaitingApprovalOrders,
  rejectOrderPayment,
} from "@/lib/admin/actions/orders";
import type { AdminOrderRecord } from "@/lib/admin/order-types";
import { actionErrorMessage } from "@/lib/admin/order-types";
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
import { cn } from "@/lib/cn";

type SectionKind = "cod" | "qr";
type PendingAction =
  | { type: "cancelCod"; order: AdminOrderRecord }
  | { type: "rejectPayment"; order: AdminOrderRecord };

const PAGE_SIZE = 10;

function locationSummary(order: AdminOrderRecord) {
  return [order.shipping_city, order.shipping_state]
    .filter(Boolean)
    .join(", ");
}

export function AwaitingApprovalOrders() {
  const [summary, setSummary] = useState({ total: 0, cod: 0, qr: 0 });
  const [codOrders, setCodOrders] = useState<AdminOrderRecord[]>([]);
  const [qrOrders, setQrOrders] = useState<AdminOrderRecord[]>([]);
  const [codTotal, setCodTotal] = useState(0);
  const [qrTotal, setQrTotal] = useState(0);
  const [codPage, setCodPage] = useState(1);
  const [qrPage, setQrPage] = useState(1);
  const [codSearch, setCodSearch] = useState("");
  const [qrSearch, setQrSearch] = useState("");
  const [open, setOpen] = useState<Record<SectionKind, boolean>>({
    cod: true,
    qr: true,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState<PendingAction | null>(null);

  const codPages = Math.max(1, Math.ceil(codTotal / PAGE_SIZE));
  const qrPages = Math.max(1, Math.ceil(qrTotal / PAGE_SIZE));

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [nextSummary, cod, qr] = await Promise.all([
        getAwaitingApprovalSummary(),
        listAwaitingApprovalOrders({
          kind: "cod",
          search: codSearch || undefined,
          page: codPage,
          pageSize: PAGE_SIZE,
        }),
        listAwaitingApprovalOrders({
          kind: "qr",
          search: qrSearch || undefined,
          page: qrPage,
          pageSize: PAGE_SIZE,
        }),
      ]);
      setSummary(nextSummary);
      setCodOrders(cod.orders);
      setCodTotal(cod.total);
      setQrOrders(qr.orders);
      setQrTotal(qr.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load your orders.");
    } finally {
      setLoading(false);
    }
  }, [codPage, codSearch, qrPage, qrSearch]);

  useEffect(() => {
    const timer = setTimeout(() => void load(), 250);
    return () => clearTimeout(timer);
  }, [load]);

  async function runAction() {
    if (!confirm) return;
    setBusy(true);
    const result =
      confirm.type === "cancelCod"
          ? await cancelCodOrder(confirm.order.id)
          : await rejectOrderPayment(confirm.order.id);

    setBusy(false);
    setConfirm(null);

    if (!result.success) {
      toast.error(actionErrorMessage(result) ?? "Couldn't update the order");
      return;
    }

    toast.success("Order updated");
    await load();
  }

  async function approveNow(kind: SectionKind, order: AdminOrderRecord) {
    setBusy(true);
    const result =
      kind === "cod"
        ? await confirmCodOrder(order.id)
        : await approveOrderPayment(order.id);
    setBusy(false);

    if (!result.success) {
      toast.error(actionErrorMessage(result) ?? "Couldn't approve the order");
      return;
    }

    toast.success(kind === "cod" ? "COD order approved" : "Payment approved");
    await load();
  }

  const confirmCopy = useMemo(() => {
    if (!confirm) return null;
    switch (confirm.type) {
      case "cancelCod":
        return {
          title: "Cancel this COD order?",
          description: "This removes the order from active orders.",
        };
      case "rejectPayment":
        return {
          title: "Reject payment proof?",
          description:
            "This marks payment as rejected and cancels the order.",
        };
    }
  }, [confirm]);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <p className="text-sm text-gray-600">
          Review COD orders and verify QR payments before they move to
          fulfillment.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <SummaryCard label="Total Waiting" value={summary.total} />
          <SummaryCard label="Cash on Delivery" value={summary.cod} />
          <SummaryCard label="Fonepay / QR Payment" value={summary.qr} />
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-5">
          <p className="text-sm font-medium text-red-800">{error}</p>
          <button
            type="button"
            onClick={() => void load()}
            className="mt-3 rounded-lg bg-white px-3 py-2 text-sm font-medium text-red-700 ring-1 ring-red-200 hover:bg-red-100"
          >
            Retry
          </button>
        </div>
      ) : null}

      <ApprovalSection
        kind="cod"
        title="Cash on Delivery Orders"
        description="Confirm COD orders before dispatch. Payment is collected when the rider delivers the order."
        total={codTotal}
        page={codPage}
        totalPages={codPages}
        search={codSearch}
        orders={codOrders}
        loading={loading}
        open={open.cod}
        onToggle={() => setOpen((prev) => ({ ...prev, cod: !prev.cod }))}
        onSearch={(value) => {
          setCodPage(1);
          setCodSearch(value);
        }}
        onPage={setCodPage}
        onAction={setConfirm}
        onApproveNow={approveNow}
      />

      <ApprovalSection
        kind="qr"
        title="Fonepay / QR Payment Orders"
        description="Check the uploaded payment proof, then verify or reject before fulfillment."
        total={qrTotal}
        page={qrPage}
        totalPages={qrPages}
        search={qrSearch}
        orders={qrOrders}
        loading={loading}
        open={open.qr}
        onToggle={() => setOpen((prev) => ({ ...prev, qr: !prev.qr }))}
        onSearch={(value) => {
          setQrPage(1);
          setQrSearch(value);
        }}
        onPage={setQrPage}
        onAction={setConfirm}
        onApproveNow={approveNow}
      />

      {confirm && confirmCopy ? (
        <ConfirmModal
          open
          title={confirmCopy.title}
          description={confirmCopy.description}
          confirmLabel={busy ? "Working..." : "Confirm"}
          onCancel={() => setConfirm(null)}
          onConfirm={() => void runAction()}
        />
      ) : null}
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold text-gray-950">{value}</p>
    </div>
  );
}

function ApprovalSection({
  kind,
  title,
  description,
  total,
  page,
  totalPages,
  search,
  orders,
  loading,
  open,
  onToggle,
  onSearch,
  onPage,
  onAction,
  onApproveNow,
}: {
  kind: SectionKind;
  title: string;
  description: string;
  total: number;
  page: number;
  totalPages: number;
  search: string;
  orders: AdminOrderRecord[];
  loading: boolean;
  open: boolean;
  onToggle: () => void;
  onSearch: (value: string) => void;
  onPage: (page: number) => void;
  onAction: (action: PendingAction) => void;
  onApproveNow: (kind: SectionKind, order: AdminOrderRecord) => void;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-start justify-between gap-4 border-b border-gray-100 px-5 py-4 text-left hover:bg-gray-50"
      >
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold text-gray-950">{title}</h2>
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
              {total} order{total === 1 ? "" : "s"}
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-600">{description}</p>
        </div>
        <ChevronDown
          className={cn(
            "mt-1 h-5 w-5 shrink-0 text-gray-500 transition-transform",
            open ? "rotate-180" : "",
          )}
        />
      </button>

      {open ? (
        <div className="p-5">
          <div className="mb-4 flex max-w-sm items-center gap-2 rounded-lg border border-gray-200 px-3 py-2">
            <Search className="h-4 w-4 text-gray-400" />
            <input
              type="search"
              value={search}
              placeholder="Search order, name, email, phone"
              onChange={(event) => onSearch(event.target.value)}
              className="w-full border-0 bg-transparent text-sm outline-none placeholder:text-gray-400"
            />
          </div>

          {loading ? (
            <ListTableSkeleton rows={4} />
          ) : orders.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
              <p className="text-sm font-medium text-gray-700">
                No orders waiting here
              </p>
              <p className="mt-1 text-xs text-gray-500">
                New matching orders will appear automatically after checkout.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                    <tr>
                      <th className="px-4 py-3">Order</th>
                      <th className="px-4 py-3">Customer</th>
                      <th className="px-4 py-3">Location</th>
                      <th className="px-4 py-3">Total</th>
                      <th className="px-4 py-3">Payment</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <ApprovalRow
                        key={order.id}
                        kind={kind}
                        order={order}
                        onAction={onAction}
                        onApproveNow={onApproveNow}
                      />
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-3 flex items-center justify-between text-xs text-gray-600">
                <span>
                  {total} order{total === 1 ? "" : "s"}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => onPage(page - 1)}
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
                    onClick={() => onPage(page + 1)}
                    className="rounded border border-gray-200 px-2 py-1 disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      ) : null}
    </section>
  );
}

function ApprovalRow({
  kind,
  order,
  onAction,
  onApproveNow,
}: {
  kind: SectionKind;
  order: AdminOrderRecord;
  onAction: (action: PendingAction) => void;
  onApproveNow: (kind: SectionKind, order: AdminOrderRecord) => void;
}) {
  const preview = orderItemPreview(order);

  return (
    <tr className="border-t border-gray-100 align-top hover:bg-gray-50/70">
      <td className="px-4 py-3">
        <Link
          href={`/admin/orders/${order.id}`}
          className="font-mono text-xs font-semibold text-primary hover:underline"
        >
          {order.order_number}
        </Link>
        <p className="mt-1 max-w-[220px] truncate text-xs font-medium text-gray-700">
          {preview.title}
        </p>
        <p className="text-xs text-gray-500">
          {preview.detail}
        </p>
      </td>
      <td className="px-4 py-3">
        <p className="font-medium text-gray-950">{order.customer_name}</p>
        <p className="text-xs text-gray-500">{order.customer_phone ?? order.customer_email}</p>
      </td>
      <td className="px-4 py-3 text-gray-700">{locationSummary(order) || "Nepal"}</td>
      <td className="px-4 py-3 font-medium">{formatNprPrice(order.total)}</td>
      <td className="px-4 py-3">
        <p>{paymentMethodLabel(order.payment_method)}</p>
        <span
          className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-xs ${paymentStatusBadgeClass(order.payment_status)}`}
        >
          {kind === "cod" ? "To be collected" : paymentStatusLabel(order.payment_status)}
        </span>
        {kind === "qr" && order.proof_file_url ? (
          <a
            href={order.proof_file_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            <ExternalLink className="h-3 w-3" />
            Open proof
          </a>
        ) : null}
      </td>
      <td className="px-4 py-3">
        <span
          className={`inline-flex rounded-full px-2 py-0.5 text-xs ${orderStatusBadgeClass(order.status)}`}
        >
          {kind === "cod"
            ? "Waiting for COD Approval"
            : orderStatusLabel(order.status)}
        </span>
      </td>
      <td className="px-4 py-3 text-xs text-gray-500">
        {formatRelativeTime(order.created_at)}
      </td>
      <td className="px-4 py-3">
        <div className="flex min-w-40 flex-col gap-2">
          {kind === "cod" ? (
            <>
              <button
                type="button"
                onClick={() => onApproveNow(kind, order)}
                className="inline-flex items-center justify-center gap-1 rounded-lg bg-green-600 px-3 py-2 text-xs font-medium text-white hover:bg-green-700"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Confirm COD
              </button>
              <button
                type="button"
                onClick={() => onAction({ type: "cancelCod", order })}
                className="inline-flex items-center justify-center gap-1 rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-50"
              >
                <XCircle className="h-3.5 w-3.5" />
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => onApproveNow(kind, order)}
                className="inline-flex items-center justify-center gap-1 rounded-lg bg-green-600 px-3 py-2 text-xs font-medium text-white hover:bg-green-700"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Verify Payment
              </button>
              <button
                type="button"
                onClick={() => onAction({ type: "rejectPayment", order })}
                className="inline-flex items-center justify-center gap-1 rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-50"
              >
                <XCircle className="h-3.5 w-3.5" />
                Reject
              </button>
            </>
          )}
          <Link
            href={`/admin/orders/${order.id}`}
            className="text-center text-xs font-medium text-primary hover:underline"
          >
            View details
          </Link>
        </div>
      </td>
    </tr>
  );
}
