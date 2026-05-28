"use client";

import { useEffect, useMemo, useState } from "react";
import { buildStoreProductPreview } from "@/lib/admin/utils";
import type { ProductFormState } from "@/lib/admin/types";

export function StoreProductPreviewPanel({
  form,
  open,
  onClose,
}: {
  form: ProductFormState;
  open: boolean;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"card" | "json">("card");
  const [debouncedForm, setDebouncedForm] = useState(form);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedForm(form), 300);
    return () => clearTimeout(timer);
  }, [form]);

  const preview = useMemo(
    () => buildStoreProductPreview(debouncedForm, debouncedForm.storefrontData),
    [debouncedForm],
  );

  const panel = (
    <div className="flex h-full flex-col border-l border-gray-200 bg-white">
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <p className="font-semibold text-gray-900">Preview</p>
        <button
          type="button"
          onClick={onClose}
          className="text-sm text-gray-500 hover:text-gray-800 lg:hidden"
        >
          Close
        </button>
      </div>
      <div className="flex border-b border-gray-200">
        {(["card", "json"] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={
              tab === key
                ? "flex-1 border-b-2 border-amber-500 py-2 text-sm font-medium text-amber-900"
                : "flex-1 py-2 text-sm text-gray-600 hover:bg-gray-50"
            }
          >
            {key === "card" ? "Card Preview" : "JSON Preview"}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-auto p-4">
        {tab === "card" ? (
          <article className="overflow-hidden rounded-xl border border-gray-200 shadow-sm">
            <div className="aspect-[4/3] bg-gray-100">
              {preview.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={preview.image}
                  alt={preview.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm italic text-gray-400">
                  Primary image
                </div>
              )}
            </div>
            <div className="space-y-2 p-4">
              {preview.badge ? (
                <span className="inline-block rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900">
                  {preview.badge}
                </span>
              ) : null}
              <h3 className="font-semibold text-gray-900">
                {preview.name || (
                  <span className="italic text-gray-400">Product name</span>
                )}
              </h3>
              <p className="text-sm text-gray-600">
                {preview.shortDescription || (
                  <span className="italic text-gray-400">Short description</span>
                )}
              </p>
              <p className="text-lg font-bold text-gray-900">
                {preview.currentPrice}
              </p>
              {preview.oldPrice ? (
                <p className="text-sm text-gray-500 line-through">
                  {preview.oldPrice}
                </p>
              ) : null}
              <p className="text-xs text-gray-500">{preview.warranty}</p>
              {preview.status ? (
                <span className="inline-block rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800">
                  {preview.status}
                </span>
              ) : null}
            </div>
          </article>
        ) : (
          <pre className="overflow-auto rounded-lg bg-gray-900 p-3 text-xs text-gray-100">
            {JSON.stringify(preview, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );

  return (
    <>
      <div className="hidden w-80 shrink-0 xl:block">{panel}</div>
      {open ? (
        <div className="fixed inset-0 z-50 xl:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            onClick={onClose}
          />
          <div className="absolute right-0 top-0 h-full w-[min(100%,20rem)] shadow-xl">
            {panel}
          </div>
        </div>
      ) : null}
    </>
  );
}
