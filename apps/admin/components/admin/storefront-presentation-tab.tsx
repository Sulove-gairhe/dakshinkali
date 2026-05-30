"use client";

import { useEffect, useState } from "react";
import { StringArrayEditor } from "./string-array-editor";
import { RelatedProductSelector } from "./related-product-selector";
import { slugifyProductName } from "@/lib/admin/utils";
import { checkSlugAvailable } from "@/lib/admin/actions/products";
import type { ProductFormState, StorefrontData } from "@/lib/admin/types";

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 text-sm">
      <span>{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-gray-300 text-amber-500 focus:ring-amber-500"
      />
    </label>
  );
}

export function StorefrontPresentationTab({
  form,
  onStorefrontChange,
}: {
  form: ProductFormState;
  onStorefrontChange: (data: StorefrontData) => void;
}) {
  const sf = form.storefrontData;
  const [slugStatus, setSlugStatus] = useState<
    "idle" | "checking" | "ok" | "taken"
  >("idle");

  useEffect(() => {
    const slug = sf.slug?.trim();
    if (!slug) {
      setSlugStatus("idle");
      return;
    }
    const timer = setTimeout(async () => {
      setSlugStatus("checking");
      try {
        const { available } = await checkSlugAvailable(slug, form.id);
        setSlugStatus(available ? "ok" : "taken");
      } catch {
        setSlugStatus("idle");
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [sf.slug, form.id]);

  function patch(partial: Partial<StorefrontData>) {
    onStorefrontChange({ ...sf, ...partial });
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-gray-700">Slug</label>
          <input
            type="text"
            value={sf.slug ?? ""}
            onChange={(e) => patch({ slug: e.target.value })}
            onBlur={() => {
              if (!sf.slug?.trim() && form.name) {
                patch({ slug: slugifyProductName(form.name) });
              }
            }}
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
          <p className="mt-1 text-xs text-gray-500">
            {slugStatus === "checking" && "Checking…"}
            {slugStatus === "ok" && "✓ Available"}
            {slugStatus === "taken" && "✗ Already taken"}
          </p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Brand</label>
          <input
            type="text"
            value={sf.brand ?? ""}
            onChange={(e) => patch({ brand: e.target.value })}
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700">
          Short description ({(sf.shortDescription ?? "").length}/200)
        </label>
        <textarea
          value={sf.shortDescription ?? ""}
          maxLength={200}
          rows={3}
          onChange={(e) => patch({ shortDescription: e.target.value })}
          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-gray-700">Warranty</label>
          <input
            type="text"
            value={sf.warranty ?? ""}
            onChange={(e) => patch({ warranty: e.target.value })}
            placeholder="1 Year Comprehensive Warranty"
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Old price</label>
          <input
            type="text"
            value={sf.oldPrice ?? ""}
            onChange={(e) => patch({ oldPrice: e.target.value || undefined })}
            placeholder="Rs. 45,000"
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700">Badges</label>
        <StringArrayEditor
          value={sf.badges ?? []}
          onChange={(badges) => patch({ badges })}
          placeholder="e.g. Rs 5,000 Off"
        />
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700">Collection</label>
        <input
          type="text"
          value={sf.collection ?? ""}
          onChange={(e) => patch({ collection: e.target.value || undefined })}
          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
        />
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <Toggle
          label="Active on storefront"
          checked={sf.isActive !== false}
          onChange={(v) => patch({ isActive: v })}
        />
        <Toggle
          label="Best seller"
          checked={!!sf.isBestSeller}
          onChange={(v) => patch({ isBestSeller: v })}
        />
        <Toggle
          label="New arrival"
          checked={!!sf.isNewArrival}
          onChange={(v) => patch({ isNewArrival: v })}
        />

        <Toggle
          label="Kitchen Appliances"
          checked={!!sf.showInKitchen}
          onChange={(v) => patch({ showInKitchen: v })}
        />
        <Toggle
          label="Trending Products"
          checked={!!sf.showInTrending}
          onChange={(v) => patch({ showInTrending: v })}
        />
        <Toggle
          label="Clearance Deals"
          checked={!!sf.showInClearance}
          onChange={(v) => patch({ showInClearance: v })}
        />
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700">Highlights</label>
        <StringArrayEditor
          value={sf.highlights ?? []}
          onChange={(highlights) => patch({ highlights })}
        />
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700">
          Box contents
        </label>
        <StringArrayEditor
          value={sf.boxContents ?? []}
          onChange={(boxContents) => patch({ boxContents })}
        />
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700">
          Delivery info
        </label>
        <StringArrayEditor
          value={sf.deliveryInfo ?? []}
          onChange={(deliveryInfo) => patch({ deliveryInfo })}
        />
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700">
          Related products
        </label>
        <RelatedProductSelector
          value={sf.relatedProductSlugs ?? []}
          onChange={(relatedProductSlugs) => patch({ relatedProductSlugs })}
          excludeProductId={form.id}
        />
      </div>
    </div>
  );
}
