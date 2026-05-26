"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CategorySelect } from "./category-select";
import { DescriptionSectionBuilder } from "./description-section-builder";
import { ProductImageManager } from "./product-image-manager";
import { SpecificationBuilder } from "./specification-builder";
import { StoreProductPreviewPanel } from "./store-product-preview-panel";
import { StorefrontPresentationTab } from "./storefront-presentation-tab";
import { StringArrayEditor } from "./string-array-editor";
import { ConfirmModal } from "./confirm-modal";
import {
  formatNprPrice,
  mapStoreStatusToDbStatus,
  normalizeStorefrontData,
  slugifyProductName,
  validateStorefrontLiveData,
} from "@/lib/admin/utils";
import { saveProduct } from "@/lib/admin/actions/products";
import type { CategoryRecord, ProductFormState } from "@/lib/admin/types";

const TABS = [
  "Core Details",
  "Images",
  "Storefront",
  "Specifications",
  "Rich Description",
  "SEO & Search",
  "Variants",
] as const;

type Tab = (typeof TABS)[number];

const STATUS_OPTIONS = ["Active", "Low Stock", "Out of Stock", "Inactive"];

function statusLabel(status: ProductFormState["status"]) {
  switch (status) {
    case "low_stock":
      return "Low Stock";
    case "out_of_stock":
      return "Out of Stock";
    case "inactive":
      return "Inactive";
    default:
      return "Active";
  }
}

export function ProductForm({
  initial,
  categories,
}: {
  initial: ProductFormState;
  categories: CategoryRecord[];
}) {
  const router = useRouter();
  const [form, setForm] = useState<ProductFormState>(initial);
  const [dirty, setDirty] = useState(false);
  const [tab, setTab] = useState<Tab>("Core Details");
  const [saving, setSaving] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [publishErrors, setPublishErrors] = useState<string[] | null>(null);
  const productId = form.id ?? crypto.randomUUID();

  const updateForm = useCallback((updater: (prev: ProductFormState) => ProductFormState) => {
    setForm(updater);
    setDirty(true);
  }, []);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  async function persist(
    publishingStatus: "draft" | "live",
    validateLive = false,
  ) {
    setSaving(true);
    try {
      const payload: ProductFormState = {
        ...form,
        storefrontData: normalizeStorefrontData({
          ...form.storefrontData,
          slug:
            form.storefrontData.slug?.trim() ||
            slugifyProductName(form.name),
        }),
        publishingStatus,
      };

      const result = await saveProduct(payload, {
        publishingStatus,
        validateLive,
      });

      if (!result.ok) {
        if (validateLive || publishingStatus === "live") {
          setPublishErrors(result.errors);
        } else {
          toast.error(result.errors.join(", "));
        }
        return;
      }

      setDirty(false);
      setPublishErrors(null);
      toast.success(
        publishingStatus === "live"
          ? "Product is now live"
          : "Draft saved",
      );

      if (!form.id && result.product.id) {
        router.replace(`/admin/products/${result.product.id}/edit`);
      } else {
        setForm((prev) => ({
          ...prev,
          id: result.product.id,
          publishingStatus: result.product.publishing_status,
        }));
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex gap-0">
      <div className="min-w-0 flex-1">
        <div className="sticky top-14 z-20 -mx-4 border-b border-gray-200 bg-white/95 px-4 py-3 backdrop-blur md:-mx-6 md:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <input
                type="text"
                value={form.name}
                onChange={(e) =>
                  updateForm((f) => ({ ...f, name: e.target.value }))
                }
                className="w-full min-w-[200px] bg-transparent text-xl font-semibold text-gray-900 focus:outline-none"
                placeholder="Product name"
              />
              <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                <span
                  className={
                    form.publishingStatus === "live"
                      ? "rounded bg-amber-100 px-2 py-0.5 text-amber-900"
                      : "rounded bg-gray-100 px-2 py-0.5"
                  }
                >
                  {form.publishingStatus}
                </span>
                {dirty ? <span className="text-amber-700">● Unsaved changes</span> : null}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm xl:hidden"
                onClick={() => setPreviewOpen(true)}
              >
                Preview
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => void persist("draft")}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50"
              >
                Save Draft
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => {
                  const validation = validateStorefrontLiveData(
                    form,
                    form.storefrontData,
                  );
                  if (!validation.valid) {
                    setPublishErrors(validation.errors);
                    return;
                  }
                  void persist("draft", false);
                  setPreviewOpen(true);
                }}
                className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900"
              >
                Save & Preview
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => void persist("live", true)}
                className="rounded-lg bg-amber-500 px-3 py-2 text-sm font-medium text-gray-900 hover:bg-amber-400"
              >
                Publish
              </button>
            </div>
          </div>
          <div className="mt-3 flex gap-1 overflow-x-auto pb-1">
            {TABS.map((label) => (
              <button
                key={label}
                type="button"
                onClick={() => setTab(label)}
                className={
                  tab === label
                    ? "whitespace-nowrap rounded-lg bg-amber-100 px-3 py-1.5 text-sm font-medium text-amber-900"
                    : "whitespace-nowrap rounded-lg px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
                }
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm md:p-6">
          {tab === "Core Details" && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Product name *</label>
                <input
                  type="text"
                  maxLength={200}
                  value={form.name}
                  onChange={(e) =>
                    updateForm((f) => ({ ...f, name: e.target.value }))
                  }
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium">
                  Base description ({form.description.length}/2000)
                </label>
                <textarea
                  rows={5}
                  maxLength={2000}
                  value={form.description}
                  onChange={(e) =>
                    updateForm((f) => ({ ...f, description: e.target.value }))
                  }
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium">Price (Rs.) *</label>
                  <input
                    type="number"
                    min={1}
                    step={1}
                    value={form.price || ""}
                    onChange={(e) =>
                      updateForm((f) => ({
                        ...f,
                        price: Number(e.target.value),
                      }))
                    }
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  />
                  {form.price > 0 ? (
                    <p className="mt-1 text-xs text-gray-500">
                      Preview: {formatNprPrice(form.price)}
                    </p>
                  ) : null}
                </div>
                <div>
                  <label className="text-sm font-medium">Category *</label>
                  <div className="mt-1">
                    <CategorySelect
                      categories={categories}
                      value={form.categoryId || null}
                      onChange={(categoryId, categoryName) =>
                        updateForm((f) => ({
                          ...f,
                          categoryId,
                          categoryName,
                        }))
                      }
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Status *</label>
                <select
                  value={statusLabel(form.status)}
                  onChange={(e) =>
                    updateForm((f) => ({
                      ...f,
                      status: mapStoreStatusToDbStatus(e.target.value),
                    }))
                  }
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm md:max-w-xs"
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {tab === "Images" && (
            <ProductImageManager
              productId={productId}
              images={form.images}
              onChange={(images) => updateForm((f) => ({ ...f, images }))}
            />
          )}

          {tab === "Storefront" && (
            <StorefrontPresentationTab
              form={form}
              onStorefrontChange={(storefrontData) =>
                updateForm((f) => ({ ...f, storefrontData }))
              }
            />
          )}

          {tab === "Specifications" && (
            <SpecificationBuilder
              value={form.storefrontData.specifications ?? []}
              onChange={(specifications) =>
                updateForm((f) => ({
                  ...f,
                  storefrontData: { ...f.storefrontData, specifications },
                }))
              }
            />
          )}

          {tab === "Rich Description" && (
            <DescriptionSectionBuilder
              value={form.storefrontData.descriptionSections ?? []}
              productImages={form.images}
              onChange={(descriptionSections) =>
                updateForm((f) => ({
                  ...f,
                  storefrontData: { ...f.storefrontData, descriptionSections },
                }))
              }
            />
          )}

          {tab === "SEO & Search" && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Search terms</label>
                <StringArrayEditor
                  value={form.storefrontData.searchTerms ?? []}
                  onChange={(searchTerms) =>
                    updateForm((f) => ({
                      ...f,
                      storefrontData: { ...f.storefrontData, searchTerms },
                    }))
                  }
                />
              </div>
              <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
                <p>
                  Slug:{" "}
                  <code>
                    {form.storefrontData.slug ||
                      slugifyProductName(form.name) ||
                      "—"}
                  </code>
                </p>
                <p className="mt-2">
                  Storefront URL:{" "}
                  <code>
                    {typeof window !== "undefined"
                      ? `${window.location.origin.replace(":3001", ":3000")}/products/${form.storefrontData.slug || slugifyProductName(form.name)}`
                      : `/products/${form.storefrontData.slug || "…"}`}
                  </code>
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">SEO title</label>
                <input
                  type="text"
                  value={form.storefrontData.seoTitle ?? ""}
                  onChange={(e) =>
                    updateForm((f) => ({
                      ...f,
                      storefrontData: {
                        ...f.storefrontData,
                        seoTitle: e.target.value || undefined,
                      },
                    }))
                  }
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium">SEO description</label>
                <textarea
                  rows={3}
                  value={form.storefrontData.seoDescription ?? ""}
                  onChange={(e) =>
                    updateForm((f) => ({
                      ...f,
                      storefrontData: {
                        ...f.storefrontData,
                        seoDescription: e.target.value || undefined,
                      },
                    }))
                  }
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                />
              </div>
            </div>
          )}

          {tab === "Variants" && (
            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-sm text-gray-600">
              Variant support (colour, size, capacity) is coming in a future
              update.
            </div>
          )}
        </div>
      </div>

      <StoreProductPreviewPanel
        form={form}
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
      />

      <ConfirmModal
        open={!!publishErrors?.length}
        title="Cannot publish yet"
        description={publishErrors?.join("\n") ?? ""}
        confirmLabel="OK"
        destructive={false}
        onCancel={() => setPublishErrors(null)}
        onConfirm={() => setPublishErrors(null)}
      />
    </div>
  );
}
