"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
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
import {
  generateProductSeo,
  MAX_VARIATIONS,
  validateSeoSuggestion,
  type ProductSeoSuggestion,
} from "@/lib/seo/generateProductSeo";

const TABS = [
  "Core Details",
  "Images",
  "Storefront",
  "Specifications",
  "Rich Description",
  "Search & Visibility",
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
  const [seoSuggestion, setSeoSuggestion] = useState<ProductSeoSuggestion | null>(null);
  const [seoPreviewTitle, setSeoPreviewTitle] = useState("");
  const [seoPreviewDescription, setSeoPreviewDescription] = useState("");
  const [seoPreviewSearchTerms, setSeoPreviewSearchTerms] = useState<string[]>([]);
  const [seoWarnings, setSeoWarnings] = useState<string[]>([]);
  const [isGeneratorUnlocked, setIsGeneratorUnlocked] = useState(false);
  const previousSeoStateRef = useRef<{
    title: string | undefined;
    description: string | undefined;
    searchTerms: string[];
  } | null>(null);
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
      toast.error(err instanceof Error ? err.message : "Couldn't save. Please try again");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex gap-0">
      <div className="min-w-0 flex-1">
        <div className="sticky top-14 z-20 -mx-4 border-b border-gray-200 bg-white/95 px-4 py-3 backdrop-blur md:-mx-6 md:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Link
                href="/admin/products"
                className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Link>
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
                        ? "rounded bg-primary/10 px-2 py-0.5 text-primary"
                        : "rounded bg-gray-100 px-2 py-0.5"
                    }
                  >
                    {form.publishingStatus}
                  </span>
                  {dirty ? <span className="text-primary">● Unsaved changes</span> : null}
                </div>
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
                onClick={async () => {
                  const validation = validateStorefrontLiveData(
                    form,
                    form.storefrontData,
                  );
                  if (!validation.valid) {
                    setPublishErrors(validation.errors);
                    return;
                  }
                  await persist("draft", false);
                  const slug =
                    form.storefrontData.slug?.trim() ||
                    slugifyProductName(form.name);
                  window.open(
                    `${window.location.origin.replace(":3001", ":3000")}/products/${slug}`,
                    "_blank",
                  );
                }}
                className="flex items-center gap-1.5 rounded-lg border border-primary/40 bg-primary/5 px-3 py-2 text-sm text-primary"
              >
                Save & Preview
                <ExternalLink className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => void persist("live", true)}
                className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
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
                    ? "whitespace-nowrap rounded-lg bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary"
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

          {tab === "Search & Visibility" && (
            <div className="space-y-6">
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                <h3 className="text-sm font-semibold text-primary">
                  Smart SEO Generator
                </h3>
                <p className="mt-1 text-xs text-primary">
                  Generate SEO title, description, and search terms from your
                  product data.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const input = {
                        name: form.name,
                        description: form.description,
                        brand: form.storefrontData.brand ?? "",
                        category: form.categoryName,
                        shortDescription:
                          form.storefrontData.shortDescription ?? "",
                        highlights: form.storefrontData.highlights ?? [],
                        specifications:
                          form.storefrontData.specifications ?? [],
                        existingSearchTerms:
                          form.storefrontData.searchTerms ?? [],
                        variants: form.storefrontData.variants ?? [],
                      };
                      const nextVi = seoSuggestion
                        ? (seoSuggestion.variationIndex + 1) % MAX_VARIATIONS
                        : 0;
                      const suggestion = generateProductSeo(input, nextVi);
                      setSeoSuggestion(suggestion);
                      setSeoPreviewTitle(suggestion.title);
                      setSeoPreviewDescription(suggestion.description);
                      setSeoPreviewSearchTerms(suggestion.searchTerms);
                      const validation = validateSeoSuggestion(
                        suggestion,
                        input,
                      );
                      setSeoWarnings(
                        validation.warnings.map((w) => w.message),
                      );
                      setIsGeneratorUnlocked(true);
                      toast.success("Search tips generated");
                    }}
                    className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    {seoSuggestion ? "Regenerate" : "Generate search tips"}
                  </button>
                  {seoSuggestion && (
                    <span className="self-center text-xs text-primary">
                      Variation {seoSuggestion.variationIndex + 1} of{" "}
                      {MAX_VARIATIONS}
                    </span>
                  )}
                  {seoSuggestion && (
                    <button
                      type="button"
                      onClick={() => {
                        const prev = {
                          title: form.storefrontData.seoTitle,
                          description: form.storefrontData.seoDescription,
                          searchTerms: form.storefrontData.searchTerms ?? [],
                        };
                        previousSeoStateRef.current = prev;
                        updateForm((f) => ({
                          ...f,
                          storefrontData: {
                            ...f.storefrontData,
                            seoTitle: seoPreviewTitle || undefined,
                            seoDescription:
                              seoPreviewDescription || undefined,
                            searchTerms: seoPreviewSearchTerms,
                          },
                        }));
                        toast("Search tips applied", {
                          action: {
                            label: "Undo",
                            onClick: () => {
                              const p = previousSeoStateRef.current;
                              if (!p) return;
                              updateForm((f) => ({
                                ...f,
                                storefrontData: {
                                  ...f.storefrontData,
                                  seoTitle: p.title,
                                  seoDescription: p.description,
                                  searchTerms: p.searchTerms,
                                },
                              }));
                              previousSeoStateRef.current = null;
                              toast.success("Changes undone");
                            },
                          },
                          duration: 4000,
                        });
                      }}
                      className="rounded-lg border border-primary/40 px-3 py-1.5 text-sm hover:bg-primary/10"
                    >
                      Apply Suggestions
                    </button>
                  )}
                </div>
                {seoSuggestion && seoSuggestion.sourceFields.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <span className="text-xs text-primary">
                      Generated from:
                    </span>
                    {seoSuggestion.sourceFields.map((field) => (
                      <span
                        key={field}
                        className="rounded bg-primary/10 px-1.5 py-0.5 text-xs text-primary"
                      >
                        {field}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {seoWarnings.length > 0 && (
                <div className="space-y-1">
                  {seoWarnings.map((w, i) => (
                    <p
                      key={i}
                      className="rounded-lg bg-primary/5 px-3 py-2 text-xs text-primary"
                    >
                      {w}
                    </p>
                  ))}
                </div>
              )}

              {seoSuggestion && (
                <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-4">
                  <h4 className="text-sm font-semibold text-gray-700">
                    Preview
                  </h4>
                  <div>
                    <label className="text-sm font-medium">SEO title</label>
                    <div className="relative mt-1">
                      <input
                        type="text"
                        value={seoPreviewTitle}
                        readOnly={!isGeneratorUnlocked}
                        onChange={(e) =>
                          setSeoPreviewTitle(e.target.value)
                        }
                        className={`w-full rounded-lg border px-3 py-2 pr-14 text-sm ${
                          isGeneratorUnlocked
                            ? "border-gray-200"
                            : "border-gray-100 bg-gray-50 text-gray-500"
                        }`}
                      />
                      <span
                        className={`absolute right-2 top-1/2 -translate-y-1/2 text-xs ${
                          seoPreviewTitle.length > 60
                            ? "text-red-500"
                            : "text-gray-400"
                        }`}
                      >
                        {seoPreviewTitle.length}/60
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">
                      SEO description
                    </label>
                    <div className="relative mt-1">
                      <textarea
                        rows={3}
                        value={seoPreviewDescription}
                        readOnly={!isGeneratorUnlocked}
                        onChange={(e) =>
                          setSeoPreviewDescription(e.target.value)
                        }
                        className={`w-full rounded-lg border px-3 py-2 pr-14 text-sm ${
                          isGeneratorUnlocked
                            ? "border-gray-200"
                            : "border-gray-100 bg-gray-50 text-gray-500"
                        }`}
                      />
                      <span
                        className={`absolute right-2 top-2 text-xs ${
                          seoPreviewDescription.length > 160
                            ? "text-red-500"
                            : seoPreviewDescription.length < 120
                              ? "text-primary"
                              : "text-gray-400"
                        }`}
                      >
                        {seoPreviewDescription.length}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">
                      Search terms ({seoPreviewSearchTerms.length})
                    </label>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {seoPreviewSearchTerms.map((term, i) => (
                        <span
                          key={i}
                          className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700"
                        >
                          {term}
                        </span>
                      ))}
                    </div>
                    <input
                      type="text"
                      placeholder="Type a term and press Enter to add..."
                      readOnly={!isGeneratorUnlocked}
                      className={`mt-2 w-full rounded-lg border px-3 py-2 text-sm ${
                        isGeneratorUnlocked
                          ? "border-gray-200"
                          : "border-gray-100 bg-gray-50 text-gray-500"
                      }`}
                      onKeyDown={(e) => {
                        if (!isGeneratorUnlocked) return;
                        if (e.key === "Enter") {
                          e.preventDefault();
                          const value = (
                            e.target as HTMLInputElement
                          ).value.trim();
                          if (value && !seoPreviewSearchTerms.includes(value)) {
                            setSeoPreviewSearchTerms((prev) => [
                              ...prev,
                              value,
                            ]);
                          }
                          (e.target as HTMLInputElement).value = "";
                        }
                      }}
                    />
                  </div>
                </div>
              )}

              <hr className="border-gray-200" />

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
