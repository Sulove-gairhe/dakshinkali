"use client";

import { useMemo, useState, useActionState } from "react";
import { Minus, Plus, Save, SlidersHorizontal } from "lucide-react";
import {
  saveStockAdjustment,
} from "@/lib/inventory/stock.actions";
import type { ActionResult, StockActionMode } from "@/lib/inventory/stockActionHelpers";
import type { ProductStatus } from "@/lib/inventory/inventory.queries";
import { cn } from "@/lib/utils/cn";

const initialState: ActionResult = { status: "idle", message: "" };

export function StockAdjustmentForm({
  productId,
  productName,
  currentQuantity,
  status,
  canAdjust,
}: {
  productId: string;
  productName: string;
  currentQuantity: number;
  status: ProductStatus;
  canAdjust: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    saveStockAdjustment,
    initialState,
  );
  const [mode, setMode] = useState<StockActionMode>("increase");
  const [quantity, setQuantity] = useState("");

  const parsedQuantity = Number.parseInt(quantity, 10);
  const safeQuantity = Number.isFinite(parsedQuantity) ? parsedQuantity : 0;
  const resultingQuantity = useMemo(() => {
    if (mode === "increase") {
      return currentQuantity + safeQuantity;
    }

    if (mode === "decrease") {
      return currentQuantity - safeQuantity;
    }

    return safeQuantity;
  }, [currentQuantity, mode, safeQuantity]);

  const reduction = mode === "decrease" || resultingQuantity < currentQuantity;
  const inactiveReduction = status === "inactive" && reduction;

  return (
    <form action={formAction} className="grid gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
      <input type="hidden" name="product_id" value={productId} />
      <input type="hidden" name="mode" value={mode} />

      <div>
        <p className="text-sm font-semibold text-slate-950">{productName}</p>
        <p className="mt-1 text-xs text-slate-500">
          Current: {currentQuantity} | Result: {Math.max(resultingQuantity, 0)}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2" aria-label="Stock adjustment mode">
        <ModeButton
          active={mode === "increase"}
          icon={<Plus className="size-4" />}
          label="Increase"
          onClick={() => setMode("increase")}
        />
        <ModeButton
          active={mode === "decrease"}
          icon={<Minus className="size-4" />}
          label="Decrease"
          onClick={() => setMode("decrease")}
        />
        <ModeButton
          active={mode === "set"}
          icon={<SlidersHorizontal className="size-4" />}
          label="Set"
          onClick={() => setMode("set")}
        />
      </div>

      <label className="grid gap-2">
        <span className="text-sm font-medium text-slate-700">
          {mode === "set" ? "New stock quantity" : "Quantity"}
        </span>
        <input
          name="quantity"
          type="number"
          min={mode === "set" ? 0 : 1}
          step={1}
          value={quantity}
          onChange={(event) => setQuantity(event.target.value)}
          disabled={!canAdjust || pending}
          className="h-10 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:bg-slate-100"
        />
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-medium text-slate-700">
          Reason {reduction ? <span className="text-red-600">*</span> : null}
        </span>
        <textarea
          name="reason"
          rows={3}
          disabled={!canAdjust || pending}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:bg-slate-100"
        />
      </label>

      {inactiveReduction ? (
        <label className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-800">
          <input
            type="checkbox"
            name="correction"
            disabled={!canAdjust || pending}
            className="mt-1 size-4"
          />
          <span>
            Inactive product reductions must be corrections and include a
            reason. The product will stay inactive.
          </span>
        </label>
      ) : null}

      {state.message ? (
        <p
          className={cn(
            "rounded-lg px-3 py-2 text-sm",
            state.status === "success"
              ? "bg-emerald-50 text-emerald-700"
              : "bg-red-50 text-red-700",
          )}
        >
          {state.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={!canAdjust || pending}
        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Save className="size-4" />
        Save adjustment
      </button>
    </form>
  );
}

function ModeButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded-lg border px-3 text-sm font-semibold transition",
        active
          ? "border-primary bg-primary text-white"
          : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100",
      )}
    >
      {icon}
      {label}
    </button>
  );
}
