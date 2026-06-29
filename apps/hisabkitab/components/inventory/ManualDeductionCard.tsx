"use client";

import { useState, useActionState } from "react";
import { AlertCircle, CheckCircle, X, XCircle } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { executeDeliveredOrderDeduction } from "@/lib/inventory/deliveredOrderDeduction.actions";
import type { ActionResult } from "@/lib/inventory/stockActionHelpers";

type ManualDeductionCardProps = {
  productId: string;
  productName: string | null;
  currentStock: number | null;
  deductQty: number;
  sourceOrder: string;
  customer: string;
  canAdjust: boolean;
  productNotVisible: boolean;
};

const initialState: ActionResult = { status: "idle", message: "" };

export function ManualDeductionCard({
  productId,
  productName,
  currentStock,
  deductQty,
  sourceOrder,
  customer,
  canAdjust,
  productNotVisible,
}: ManualDeductionCardProps) {
  const [dismissed, setDismissed] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [state, formAction, pending] = useActionState(
    executeDeliveredOrderDeduction,
    initialState,
  );

  // Hide card if dismissed or successfully completed
  if (dismissed || state.status === "success") {
    return null;
  }

  const displayName = productName || productId;
  const resultingStock = currentStock !== null ? currentStock - deductQty : null;

  const handleWrongClick = () => {
    // "Wrong" dismisses the card - user can manually search and adjust
    setDismissed(true);
  };

  const handleConfirm = () => {
    // Trigger form submission programmatically
    const form = document.getElementById("deduction-form") as HTMLFormElement;
    if (form) {
      form.requestSubmit();
    }
    setShowConfirmation(false);
  };

  return (
    <>
      <section className="mb-4 rounded-lg border border-primary/30 bg-primary/5 p-4 shadow-md">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <AlertCircle className="size-5 text-primary" />
              <h3 className="font-semibold text-primary">
                Manual Deduction Pending
              </h3>
            </div>

            <dl className="mt-3 grid gap-2 text-sm">
              <div>
                <span className="font-medium text-slate-700">Order:</span>{" "}
                <span className="text-slate-950">{sourceOrder}</span>
              </div>
              <div>
                <span className="font-medium text-slate-700">Customer:</span>{" "}
                <span className="text-slate-950">{customer}</span>
              </div>
              <div>
                <span className="font-medium text-slate-700">Product:</span>{" "}
                <span className="text-slate-950">{displayName}</span>
              </div>
              <div>
                <span className="font-medium text-slate-700">
                  Suggested deduction:
                </span>{" "}
                <span className="font-semibold text-red-600">-{deductQty}</span>
              </div>
              {currentStock !== null && resultingStock !== null ? (
                <div>
                  <span className="font-medium text-slate-700">
                    Current stock:
                  </span>{" "}
                  <span className="text-slate-950">{currentStock}</span>{" "}
                  <span className="text-slate-500">→</span>{" "}
                  <span className="text-slate-950">{Math.max(resultingStock, 0)}</span>
                </div>
              ) : null}
            </dl>

            {productNotVisible ? (
              <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                <span>
                  Product not visible in current filter/search. Verify product
                  before confirming deduction.
                </span>
              </div>
            ) : null}

            {state.status === "error" && state.message ? (
              <div className="mt-3 flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                <XCircle className="mt-0.5 size-4 shrink-0" />
                <span>{state.message}</span>
              </div>
            ) : null}
          </div>

          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="text-slate-400 transition hover:text-slate-600"
            aria-label="Dismiss"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="mt-4 flex gap-3">
          <button
            type="button"
            onClick={() => setShowConfirmation(true)}
            disabled={!canAdjust || pending || productNotVisible}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            <CheckCircle className="size-4" />
            Correct
          </button>

          <button
            type="button"
            onClick={handleWrongClick}
            disabled={pending}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <XCircle className="size-4" />
            Wrong
          </button>
        </div>

        {!canAdjust ? (
          <p className="mt-2 text-xs text-slate-500">
            You do not have permission to adjust stock.
          </p>
        ) : null}

        {/* Hidden form for server action submission */}
        <form id="deduction-form" action={formAction} className="hidden">
          <input type="hidden" name="product_id" value={productId} />
          <input type="hidden" name="quantity" value={deductQty} />
          <input type="hidden" name="source_order" value={sourceOrder} />
          <input type="hidden" name="customer" value={customer} />
        </form>
      </section>

      {/* Confirmation Modal */}
      {showConfirmation ? (
        <ConfirmationModal
          productName={displayName}
          quantity={deductQty}
          onCancel={() => setShowConfirmation(false)}
          onConfirm={handleConfirm}
          pending={pending}
        />
      ) : null}
    </>
  );
}

function ConfirmationModal({
  productName,
  quantity,
  onCancel,
  onConfirm,
  pending,
}: {
  productName: string;
  quantity: number;
  onCancel: () => void;
  onConfirm: () => void;
  pending: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        onClick={onCancel}
        aria-label="Close"
        disabled={pending}
      />
      <div className="relative w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-slate-900">
          Confirm Stock Deduction
        </h3>
        <p className="mt-2 text-sm text-slate-600">
          Confirm stock deduction of <span className="font-semibold">{quantity}</span> for{" "}
          <span className="font-semibold">{productName}</span>? This action will
          update inventory.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            className={cn(
              "rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60",
              pending && "opacity-60",
            )}
          >
            {pending ? "Processing..." : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}
