"use client";

import { useMemo, useState } from "react";
import {
  Archive,
  AlertTriangle,
  CalendarClock,
  Check,
  ChevronsUpDown,
  CircleOff,
  Pencil,
  Plus,
  Search,
  TicketPercent,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  calculateCouponDiscount,
  getCouponStatus,
  normalizeCouponCode,
  type CouponApplicabilityType,
  type CouponDiscountType,
  type CouponRecord,
  type CouponStatus,
} from "@dakshinkali/database";
import type { AdminProductRecord, CategoryRecord } from "@/lib/admin/types";
import { cn } from "@/lib/cn";
import {
  archiveCoupon,
  createCoupon,
  toggleCouponActive,
  updateCoupon,
  type CouponInput,
} from "@/lib/admin/actions/coupons";
import { ConfirmModal } from "./confirm-modal";

type TargetTab = "categories" | "products";

const inputClassName =
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/25";

interface CouponDraft {
  code: string;
  description: string;
  discount_type: CouponDiscountType;
  discount_value: string;
  max_discount_amount: string;
  is_active: boolean;
  starts_at: string;
  ends_at: string;
  applicability_type: CouponApplicabilityType;
  applicable_category_ids: string[];
  applicable_product_ids: string[];
  minimum_order_amount: string;
  usage_limit: string;
}

export function CouponsManager({
  initialCoupons,
  categories,
  products,
  setupRequired = false,
}: {
  initialCoupons: CouponRecord[];
  categories: CategoryRecord[];
  products: AdminProductRecord[];
  setupRequired?: boolean;
}) {
  const [coupons, setCoupons] = useState(initialCoupons);
  const [query, setQuery] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<CouponRecord | null>(null);
  const [draft, setDraft] = useState(() => createDraft());
  const [sampleAmount, setSampleAmount] = useState("25000");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectorTab, setSelectorTab] = useState<TargetTab>("categories");
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [selectorSearch, setSelectorSearch] = useState("");
  const [confirm, setConfirm] = useState<{
    coupon: CouponRecord;
    action: "archive" | "disable";
  } | null>(null);

  const filteredCoupons = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return coupons;
    return coupons.filter((coupon) =>
      [coupon.code, coupon.description ?? "", coupon.discount_type]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [coupons, query]);

  const stats = useMemo(() => {
    const entries = coupons.map((coupon) => getCouponStatus(coupon));
    return {
      active: entries.filter((status) => status === "active").length,
      scheduled: entries.filter((status) => status === "scheduled").length,
      expired: entries.filter((status) => status === "expired").length,
      disabled: entries.filter((status) => status === "disabled").length,
    };
  }, [coupons]);

  const preview = calculateCouponDiscount(
    {
      discount_type: draft.discount_type,
      discount_value: Number(draft.discount_value) || 0,
      max_discount_amount: draft.max_discount_amount
        ? Number(draft.max_discount_amount)
        : null,
    },
    Number(sampleAmount) || 0,
  );

  function openCreate() {
    if (setupRequired) {
      toast.error("Please set up the coupon feature before creating coupons.");
      return;
    }
    setEditing(null);
    setDraft(createDraft());
    setError(null);
    setDrawerOpen(true);
  }

  function openEdit(coupon: CouponRecord) {
    setEditing(coupon);
    setDraft(createDraft(coupon));
    setError(null);
    setDrawerOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const payload = draftToInput(draft);
      const saved = editing
        ? await updateCoupon(editing.id, payload)
        : await createCoupon(payload);

      setCoupons((prev) =>
        editing
          ? prev.map((coupon) => (coupon.id === saved.id ? saved : coupon))
          : [saved, ...prev],
      );
      setDrawerOpen(false);
      toast.success(editing ? "Coupon updated" : "Coupon created");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Couldn't save coupon";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(coupon: CouponRecord, nextActive: boolean) {
    if (!nextActive) {
      setConfirm({ coupon, action: "disable" });
      return;
    }
    try {
      const updated = await toggleCouponActive(coupon.id, true);
      setCoupons((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item)),
      );
      toast.success("Coupon activated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't update coupon");
    }
  }

  async function runConfirm() {
    if (!confirm) return;
    try {
      if (confirm.action === "archive") {
        await archiveCoupon(confirm.coupon.id);
        setCoupons((prev) => prev.filter((item) => item.id !== confirm.coupon.id));
        toast.success("Coupon archived");
      } else {
        const updated = await toggleCouponActive(confirm.coupon.id, false);
        setCoupons((prev) =>
          prev.map((item) => (item.id === updated.id ? updated : item)),
        );
        toast.success("Coupon disabled");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setConfirm(null);
    }
  }

  const selectedCategories = categories.filter((category) =>
    draft.applicable_category_ids.includes(category.id),
  );
  const selectedProducts = products.filter((product) =>
    draft.applicable_product_ids.includes(product.id),
  );

  return (
    <>
      <div className="space-y-5">
        {setupRequired ? <SetupRequiredBanner /> : null}

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Active" value={stats.active} tone="green" />
          <StatCard label="Scheduled" value={stats.scheduled} tone="blue" />
          <StatCard label="Expired" value={stats.expired} tone="amber" />
          <StatCard label="Disabled" value={stats.disabled} tone="gray" />
        </div>

        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-gray-100 p-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-950">Coupon Management</h2>
              <p className="text-sm text-gray-500">
                Create scheduled, product-aware discounts for checkout.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search coupons"
                  className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 sm:w-64"
                />
              </div>
              <button
                type="button"
                onClick={openCreate}
                disabled={setupRequired}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Plus className="h-4 w-4" />
                New coupon
              </button>
            </div>
          </div>

          {coupons.length === 0 ? (
            <EmptyState onCreate={openCreate} />
          ) : filteredCoupons.length === 0 ? (
            <div className="p-10 text-center text-sm text-gray-500">
              No coupons match &ldquo;{query}&rdquo;.
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredCoupons.map((coupon) => (
                <CouponRow
                  key={coupon.id}
                  coupon={coupon}
                  categories={categories}
                  products={products}
                  onEdit={() => openEdit(coupon)}
                  onToggle={(active) => void handleToggle(coupon, active)}
                  onArchive={() => setConfirm({ coupon, action: "archive" })}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {drawerOpen ? (
        <div className="fixed inset-0 z-50 flex justify-end">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            onClick={() => setDrawerOpen(false)}
            aria-label="Close coupon form"
          />
          <div className="relative flex h-full w-full max-w-3xl flex-col overflow-hidden bg-white shadow-xl">
            <div className="flex items-start justify-between border-b border-gray-200 p-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                  {editing ? "Edit coupon" : "Create coupon"}
                </p>
                <h2 className="text-xl font-bold text-gray-950">Coupon Code</h2>
              </div>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              <div className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(260px,0.8fr)]">
                <div className="space-y-5">
                  <Panel title="Coupon Details">
                    <Field label="Coupon Code">
                      <input
                        value={draft.code}
                        onChange={(event) =>
                          setDraft((prev) => ({
                            ...prev,
                            code: normalizeCouponCode(event.target.value),
                          }))
                        }
                        placeholder="DASHAIN2000"
                        className={inputClassName}
                      />
                    </Field>
                    <Field label="Description">
                      <textarea
                        value={draft.description}
                        onChange={(event) =>
                          setDraft((prev) => ({
                            ...prev,
                            description: event.target.value,
                          }))
                        }
                        rows={2}
                        placeholder="Optional internal note"
                        className={inputClassName}
                      />
                    </Field>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field label="Discount Type">
                        <select
                          value={draft.discount_type}
                          onChange={(event) =>
                            setDraft((prev) => ({
                              ...prev,
                              discount_type: event.target.value as CouponDiscountType,
                              max_discount_amount:
                                event.target.value === "fixed"
                                  ? ""
                                  : prev.max_discount_amount,
                            }))
                          }
                          className={inputClassName}
                        >
                          <option value="fixed">Fixed amount</option>
                          <option value="percentage">Percentage</option>
                        </select>
                      </Field>
                      <Field
                        label={
                          draft.discount_type === "fixed"
                            ? "Discount Value (NPR)"
                            : "Discount Value (%)"
                        }
                      >
                        <input
                          type="number"
                          min="0"
                          value={draft.discount_value}
                          onChange={(event) =>
                            setDraft((prev) => ({
                              ...prev,
                              discount_value: event.target.value,
                            }))
                          }
                          className={inputClassName}
                        />
                      </Field>
                    </div>
                    {draft.discount_type === "percentage" ? (
                      <Field label="Maximum Discount Cap (optional)">
                        <input
                          type="number"
                          min="0"
                          value={draft.max_discount_amount}
                          onChange={(event) =>
                            setDraft((prev) => ({
                              ...prev,
                              max_discount_amount: event.target.value,
                            }))
                          }
                          placeholder="2000"
                          className={inputClassName}
                        />
                      </Field>
                    ) : null}
                  </Panel>

                  <Panel title="Applicable To">
                    <div className="grid gap-2 sm:grid-cols-3">
                      {(["all", "categories", "products"] as const).map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() =>
                            setDraft((prev) => ({
                              ...prev,
                              applicability_type: type,
                              applicable_category_ids:
                                type === "categories"
                                  ? prev.applicable_category_ids
                                  : [],
                              applicable_product_ids:
                                type === "products" ? prev.applicable_product_ids : [],
                            }))
                          }
                          className={cn(
                            "rounded-lg border px-3 py-2 text-sm font-semibold transition-colors",
                            draft.applicability_type === type
                              ? "border-primary bg-primary/5 text-primary"
                              : "border-gray-200 text-gray-700 hover:bg-gray-50",
                          )}
                        >
                          {type === "all"
                            ? "All products"
                            : type === "categories"
                              ? "Categories"
                              : "Products"}
                        </button>
                      ))}
                    </div>

                    {draft.applicability_type === "all" ? (
                      <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                        This coupon applies to every product in the cart.
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectorTab(draft.applicability_type as TargetTab);
                          setSelectorOpen(true);
                        }}
                        className="flex w-full items-center justify-between rounded-lg border border-gray-200 px-3 py-3 text-left text-sm hover:bg-gray-50"
                      >
                        <span>
                          <span className="block font-semibold text-gray-900">
                            {draft.applicability_type === "categories"
                              ? `${selectedCategories.length} categories selected`
                              : `${selectedProducts.length} products selected`}
                          </span>
                          <span className="text-gray-500">
                            Open searchable selector
                          </span>
                        </span>
                        <ChevronsUpDown className="h-4 w-4 text-gray-400" />
                      </button>
                    )}
                  </Panel>

                  <Panel title="Validity Period">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field label="Start date/time">
                        <input
                          type="datetime-local"
                          value={draft.starts_at}
                          onChange={(event) =>
                            setDraft((prev) => ({
                              ...prev,
                              starts_at: event.target.value,
                            }))
                          }
                          className={inputClassName}
                        />
                      </Field>
                      <Field label="End date/time">
                        <input
                          type="datetime-local"
                          value={draft.ends_at}
                          onChange={(event) =>
                            setDraft((prev) => ({
                              ...prev,
                              ends_at: event.target.value,
                            }))
                          }
                          className={inputClassName}
                        />
                      </Field>
                    </div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                      <input
                        type="checkbox"
                        checked={draft.is_active}
                        onChange={(event) =>
                          setDraft((prev) => ({
                            ...prev,
                            is_active: event.target.checked,
                          }))
                        }
                        className="h-4 w-4 rounded border-gray-300 text-primary"
                      />
                      Coupon is enabled
                    </label>
                  </Panel>

                  <Panel title="Usage Rules">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field label="Minimum Order Amount">
                        <input
                          type="number"
                          min="0"
                          value={draft.minimum_order_amount}
                          onChange={(event) =>
                            setDraft((prev) => ({
                              ...prev,
                              minimum_order_amount: event.target.value,
                            }))
                          }
                          placeholder="Optional"
                          className={inputClassName}
                        />
                      </Field>
                      <Field label="Usage Limit">
                        <input
                          type="number"
                          min="1"
                          value={draft.usage_limit}
                          onChange={(event) =>
                            setDraft((prev) => ({
                              ...prev,
                              usage_limit: event.target.value,
                            }))
                          }
                          placeholder="Optional"
                          className={inputClassName}
                        />
                      </Field>
                    </div>
                  </Panel>
                </div>

                <div className="space-y-5">
                  <Panel title="Live Preview">
                    <Field label="Sample Order Amount">
                      <input
                        type="number"
                        min="0"
                        value={sampleAmount}
                        onChange={(event) => setSampleAmount(event.target.value)}
                        className={inputClassName}
                      />
                    </Field>
                    <div className="space-y-3 rounded-xl bg-gray-50 p-4">
                      <AmountLine label="Original amount" value={preview.originalAmount} />
                      <AmountLine label="Discount amount" value={preview.discountAmount} accent />
                      <div className="border-t border-dashed border-gray-300 pt-3">
                        <AmountLine label="Final payable" value={preview.finalAmount} strong />
                      </div>
                    </div>
                  </Panel>

                  <Panel title="Current Selection">
                    <div className="space-y-2 text-sm">
                      <SummaryPill
                        label="Code"
                        value={draft.code || "No code yet"}
                      />
                      <SummaryPill
                        label="Applies to"
                        value={
                          draft.applicability_type === "all"
                            ? "All products"
                            : draft.applicability_type === "categories"
                              ? `${selectedCategories.length} categories`
                              : `${selectedProducts.length} products`
                        }
                      />
                      <SummaryPill
                        label="Status"
                        value={draft.is_active ? "Enabled" : "Disabled"}
                      />
                    </div>
                  </Panel>

                  {error ? (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
                      {error}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-gray-200 p-5">
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={saving}
                className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save coupon"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {selectorOpen ? (
        <SelectorModal
          tab={selectorTab}
          setTab={(tab) => {
            setSelectorTab(tab);
            setDraft((prev) => ({
              ...prev,
              applicability_type: tab,
              applicable_category_ids:
                tab === "categories" ? prev.applicable_category_ids : [],
              applicable_product_ids:
                tab === "products" ? prev.applicable_product_ids : [],
            }));
          }}
          search={selectorSearch}
          setSearch={setSelectorSearch}
          categories={categories}
          products={products}
          selectedCategoryIds={draft.applicable_category_ids}
          selectedProductIds={draft.applicable_product_ids}
          onClose={() => setSelectorOpen(false)}
          onToggleCategory={(id) =>
            setDraft((prev) => ({
              ...prev,
              applicability_type: "categories",
              applicable_category_ids: toggleId(prev.applicable_category_ids, id),
              applicable_product_ids: [],
            }))
          }
          onToggleProduct={(id) =>
            setDraft((prev) => ({
              ...prev,
              applicability_type: "products",
              applicable_product_ids: toggleId(prev.applicable_product_ids, id),
              applicable_category_ids: [],
            }))
          }
        />
      ) : null}

      <ConfirmModal
        open={confirm !== null}
        title={confirm?.action === "archive" ? "Archive coupon?" : "Disable coupon?"}
        description={
          confirm?.action === "archive"
            ? "Archived coupons are removed from the active management list and can no longer be used."
            : "Disabled coupons remain visible to admins but customers cannot apply them."
        }
        confirmLabel={confirm?.action === "archive" ? "Archive" : "Disable"}
        onCancel={() => setConfirm(null)}
        onConfirm={() => void runConfirm()}
        destructive
      />
    </>
  );
}

function CouponRow({
  coupon,
  categories,
  products,
  onEdit,
  onToggle,
  onArchive,
}: {
  coupon: CouponRecord;
  categories: CategoryRecord[];
  products: AdminProductRecord[];
  onEdit: () => void;
  onToggle: (active: boolean) => void;
  onArchive: () => void;
}) {
  const status = getCouponStatus(coupon);
  const targetLabel = getTargetLabel(coupon, categories, products);

  return (
    <article className="grid gap-4 p-4 transition-colors hover:bg-gray-50/70 lg:grid-cols-[minmax(220px,1.1fr)_minmax(220px,1fr)_minmax(180px,0.8fr)_auto] lg:items-center">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-base font-black tracking-wide text-gray-950">
            {coupon.code}
          </span>
          <StatusBadge status={status} />
        </div>
        <p className="mt-1 line-clamp-1 text-sm text-gray-500">
          {coupon.description || "No description"}
        </p>
      </div>

      <div className="space-y-1 text-sm">
        <p className="font-semibold text-gray-900">
          {coupon.discount_type === "fixed"
            ? `Rs. ${formatNumber(coupon.discount_value)} off`
            : `${formatNumber(coupon.discount_value)}% off`}
          {coupon.max_discount_amount
            ? ` up to Rs. ${formatNumber(coupon.max_discount_amount)}`
            : ""}
        </p>
        <p className="text-gray-500">{targetLabel}</p>
      </div>

      <div className="space-y-1 text-sm text-gray-600">
        <p className="flex items-center gap-1.5">
          <CalendarClock className="h-4 w-4 text-gray-400" />
          {formatDate(coupon.starts_at)}
        </p>
        <p className="text-gray-500">Ends {formatDate(coupon.ends_at)}</p>
        <p className="text-xs text-gray-500">
          Used {coupon.used_count}
          {coupon.usage_limit ? ` / ${coupon.usage_limit}` : ""}
        </p>
      </div>

      <div className="flex items-center gap-2 lg:justify-end">
        <button
          type="button"
          onClick={() => onToggle(!coupon.is_active)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold",
            coupon.is_active
              ? "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
              : "border-emerald-200 bg-emerald-50 text-emerald-700",
          )}
        >
          {coupon.is_active ? <CircleOff className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
          {coupon.is_active ? "Disable" : "Activate"}
        </button>
        <button
          type="button"
          onClick={onEdit}
          className="rounded-lg border border-gray-200 bg-white p-2 text-gray-600 hover:bg-gray-50"
          aria-label={`Edit ${coupon.code}`}
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onArchive}
          className="rounded-lg border border-red-100 bg-white p-2 text-red-600 hover:bg-red-50"
          aria-label={`Archive ${coupon.code}`}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </article>
  );
}

function SetupRequiredBanner() {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900 shadow-sm">
      <div className="flex gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
        <div>
          <h2 className="text-sm font-bold">Coupon database setup required</h2>
          <p className="mt-1 text-sm leading-6 text-amber-800">
            Please set up the coupon feature in your database, then reload this page. The admin panel is ready,
            but the coupon data needs to be activated first.
          </p>
        </div>
      </div>
    </div>
  );
}

function SelectorModal(props: {
  tab: TargetTab;
  setTab: (tab: TargetTab) => void;
  search: string;
  setSearch: (search: string) => void;
  categories: CategoryRecord[];
  products: AdminProductRecord[];
  selectedCategoryIds: string[];
  selectedProductIds: string[];
  onToggleCategory: (id: string) => void;
  onToggleProduct: (id: string) => void;
  onClose: () => void;
}) {
  const q = props.search.trim().toLowerCase();
  const visibleCategories = props.categories.filter((item) =>
    [item.name, item.slug].join(" ").toLowerCase().includes(q),
  );
  const visibleProducts = props.products.filter((item) =>
    [item.name, item.category].join(" ").toLowerCase().includes(q),
  );
  const selectedCount =
    props.tab === "categories"
      ? props.selectedCategoryIds.length
      : props.selectedProductIds.length;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/45"
        onClick={props.onClose}
        aria-label="Close selector"
      />
      <div className="relative flex max-h-[86vh] w-full max-w-2xl flex-col rounded-xl bg-white shadow-2xl">
        <div className="border-b border-gray-200 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-gray-950">
                Select coupon targets
              </h3>
              <p className="text-sm text-gray-500">{selectedCount} selected</p>
            </div>
            <button
              type="button"
              onClick={props.onClose}
              className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="mt-4 grid grid-cols-2 rounded-lg bg-gray-100 p-1">
            {(["categories", "products"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => props.setTab(tab)}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-semibold",
                  props.tab === tab
                    ? "bg-white text-primary shadow-sm"
                    : "text-gray-600",
                )}
              >
                {tab === "categories" ? "Categories" : "Products"}
              </button>
            ))}
          </div>
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={props.search}
              onChange={(event) => props.setSearch(event.target.value)}
              placeholder={`Search ${props.tab}`}
              className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          {props.tab === "categories" ? (
            visibleCategories.length === 0 ? (
              <NoResults />
            ) : (
              visibleCategories.map((category) => (
                <SelectorItem
                  key={category.id}
                  title={category.name}
                  subtitle={category.slug}
                  selected={props.selectedCategoryIds.includes(category.id)}
                  onToggle={() => props.onToggleCategory(category.id)}
                />
              ))
            )
          ) : visibleProducts.length === 0 ? (
            <NoResults />
          ) : (
            visibleProducts.map((product) => (
              <SelectorItem
                key={product.id}
                title={product.name}
                subtitle={product.category}
                selected={props.selectedProductIds.includes(product.id)}
                onToggle={() => props.onToggleProduct(product.id)}
              />
            ))
          )}
        </div>
        <div className="flex justify-between border-t border-gray-200 p-4">
          <button
            type="button"
            onClick={() => props.setSearch("")}
            className="text-sm font-semibold text-gray-600 hover:text-gray-900"
          >
            Clear search
          </button>
          <button
            type="button"
            onClick={props.onClose}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

function SelectorItem({
  title,
  subtitle,
  selected,
  onToggle,
}: {
  title: string;
  subtitle: string;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="mb-2 flex w-full items-center justify-between rounded-lg border border-gray-200 px-3 py-3 text-left hover:bg-gray-50"
    >
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold text-gray-900">
          {title}
        </span>
        <span className="block truncate text-xs text-gray-500">{subtitle}</span>
      </span>
      <span
        className={cn(
          "ml-3 flex h-5 w-5 items-center justify-center rounded border",
          selected
            ? "border-primary bg-primary text-primary-foreground"
            : "border-gray-300 bg-white",
        )}
      >
        {selected ? <Check className="h-3.5 w-3.5" /> : null}
      </span>
    </button>
  );
}

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-gray-500">
        {title}
      </h3>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-gray-800">
        {label}
      </span>
      {children}
    </label>
  );
}

function StatusBadge({ status }: { status: CouponStatus }) {
  const classes = {
    active: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    scheduled: "bg-blue-50 text-blue-700 ring-blue-200",
    expired: "bg-amber-50 text-amber-700 ring-amber-200",
    disabled: "bg-gray-100 text-gray-600 ring-gray-200",
  };

  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-1 text-xs font-bold capitalize ring-1",
        classes[status],
      )}
    >
      {status}
    </span>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "green" | "blue" | "amber" | "gray";
}) {
  const tones = {
    green: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    blue: "bg-blue-50 text-blue-700 ring-blue-100",
    amber: "bg-amber-50 text-amber-700 ring-amber-100",
    gray: "bg-gray-100 text-gray-700 ring-gray-200",
  };
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-500">{label}</p>
        <span className={cn("rounded-lg p-2 ring-1", tones[tone])}>
          <TicketPercent className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-3 text-2xl font-black text-gray-950">{value}</p>
    </div>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <div className="rounded-2xl bg-primary/5 p-4 text-primary ring-1 ring-primary/10">
        <Archive className="h-8 w-8" />
      </div>
      <h3 className="mt-4 text-lg font-bold text-gray-950">No coupons yet</h3>
      <p className="mt-1 max-w-md text-sm text-gray-500">
        Create a fixed amount or percentage coupon and control exactly when and
        where customers can use it.
      </p>
      <button
        type="button"
        onClick={onCreate}
        className="mt-5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
      >
        Create first coupon
      </button>
    </div>
  );
}

function AmountLine({
  label,
  value,
  accent,
  strong,
}: {
  label: string;
  value: number;
  accent?: boolean;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className={strong ? "font-bold text-gray-950" : "text-gray-600"}>
        {label}
      </span>
      <span
        className={cn(
          strong ? "text-lg font-black text-gray-950" : "font-semibold",
          accent ? "text-emerald-700" : "text-gray-900",
        )}
      >
        Rs. {formatNumber(value)}
      </span>
    </div>
  );
}

function SummaryPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-gray-50 px-3 py-2">
      <span className="text-gray-500">{label}</span>
      <span className="truncate font-semibold text-gray-900">{value}</span>
    </div>
  );
}

function NoResults() {
  return (
    <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
      No matching results.
    </div>
  );
}

function createDraft(coupon?: CouponRecord): CouponDraft {
  const now = new Date();
  const nextMonth = new Date(now);
  nextMonth.setMonth(now.getMonth() + 1);

  return {
    code: coupon?.code ?? "",
    description: coupon?.description ?? "",
    discount_type: coupon?.discount_type ?? "fixed",
    discount_value: coupon ? String(coupon.discount_value) : "2000",
    max_discount_amount: coupon?.max_discount_amount
      ? String(coupon.max_discount_amount)
      : "",
    is_active: coupon?.is_active ?? true,
    starts_at: toLocalInput(coupon?.starts_at ?? now.toISOString()),
    ends_at: toLocalInput(coupon?.ends_at ?? nextMonth.toISOString()),
    applicability_type: coupon?.applicability_type ?? "all",
    applicable_category_ids: coupon?.applicable_category_ids ?? [],
    applicable_product_ids: coupon?.applicable_product_ids ?? [],
    minimum_order_amount: coupon?.minimum_order_amount
      ? String(coupon.minimum_order_amount)
      : "",
    usage_limit: coupon?.usage_limit ? String(coupon.usage_limit) : "",
  };
}

function draftToInput(draft: CouponDraft): CouponInput {
  return {
    code: draft.code,
    description: draft.description,
    discount_type: draft.discount_type,
    discount_value: Number(draft.discount_value),
    max_discount_amount: draft.max_discount_amount
      ? Number(draft.max_discount_amount)
      : null,
    is_active: draft.is_active,
    starts_at: new Date(draft.starts_at).toISOString(),
    ends_at: new Date(draft.ends_at).toISOString(),
    applicability_type: draft.applicability_type,
    applicable_category_ids: draft.applicable_category_ids,
    applicable_product_ids: draft.applicable_product_ids,
    minimum_order_amount: draft.minimum_order_amount
      ? Number(draft.minimum_order_amount)
      : null,
    usage_limit: draft.usage_limit ? Number(draft.usage_limit) : null,
  };
}

function toggleId(items: string[], id: string) {
  return items.includes(id)
    ? items.filter((item) => item !== id)
    : [...items, id];
}

function getTargetLabel(
  coupon: CouponRecord,
  categories: CategoryRecord[],
  products: AdminProductRecord[],
) {
  if (coupon.applicability_type === "all") return "All products";
  if (coupon.applicability_type === "categories") {
    const names = categories
      .filter((category) => coupon.applicable_category_ids.includes(category.id))
      .map((category) => category.name);
    return names.length > 0 ? names.join(", ") : "Selected categories";
  }
  const names = products
    .filter((product) => coupon.applicable_product_ids.includes(product.id))
    .slice(0, 3)
    .map((product) => product.name);
  const extra = Math.max(0, coupon.applicable_product_ids.length - names.length);
  return `${names.join(", ")}${extra ? ` +${extra} more` : ""}` || "Selected products";
}

function toLocalInput(value: string) {
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-NP", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-NP", {
    maximumFractionDigits: 0,
  }).format(value);
}
