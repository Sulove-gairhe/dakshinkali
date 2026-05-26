"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { StringArrayEditor } from "./string-array-editor";
import { ConfirmModal } from "./confirm-modal";
import type { ProductDescriptionSection, ProductImageRecord } from "@/lib/admin/types";

export function DescriptionSectionBuilder({
  value,
  onChange,
  productImages,
}: {
  value: ProductDescriptionSection[];
  onChange: (sections: ProductDescriptionSection[]) => void;
  productImages: ProductImageRecord[];
}) {
  const [pendingRemoveIndex, setPendingRemoveIndex] = useState<number | null>(
    null,
  );

  function updateSection(index: number, section: ProductDescriptionSection) {
    const next = [...value];
    next[index] = section;
    onChange(next);
  }

  return (
    <div className="space-y-4">
      {value.map((section, index) => (
        <div
          key={section.id}
          className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
        >
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-medium text-gray-900">Section {index + 1}</h4>
            <div className="flex gap-1">
              <button
                type="button"
                disabled={index === 0}
                onClick={() => {
                  const next = [...value];
                  [next[index - 1], next[index]] = [next[index], next[index - 1]];
                  onChange(next);
                }}
                className="rounded p-1 text-gray-500 hover:bg-gray-100 disabled:opacity-30"
              >
                <ChevronUp className="h-4 w-4" />
              </button>
              <button
                type="button"
                disabled={index === value.length - 1}
                onClick={() => {
                  const next = [...value];
                  [next[index], next[index + 1]] = [next[index + 1], next[index]];
                  onChange(next);
                }}
                className="rounded p-1 text-gray-500 hover:bg-gray-100 disabled:opacity-30"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setPendingRemoveIndex(index)}
                className="rounded p-1 text-red-500 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-gray-600">Title</label>
              <input
                type="text"
                value={section.title}
                onChange={(e) =>
                  updateSection(index, { ...section, title: e.target.value })
                }
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">
                Subtitle (optional)
              </label>
              <input
                type="text"
                value={section.subtitle ?? ""}
                onChange={(e) =>
                  updateSection(index, {
                    ...section,
                    subtitle: e.target.value || undefined,
                  })
                }
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-xs font-medium text-gray-600">Body paragraphs</p>
            <StringArrayEditor
              value={section.body ?? []}
              onChange={(body) => updateSection(index, { ...section, body })}
              placeholder="Add paragraph"
            />
          </div>
          <div className="mt-4">
            <p className="text-xs font-medium text-gray-600">Bullet points</p>
            <StringArrayEditor
              value={section.bullets ?? []}
              onChange={(bullets) =>
                updateSection(index, { ...section, bullets })
              }
              placeholder="Add bullet"
            />
          </div>
          <div className="mt-4">
            <label className="text-xs font-medium text-gray-600">
              Section image (from uploaded gallery)
            </label>
            <select
              value={section.image?.id ?? ""}
              onChange={(e) => {
                const img = productImages.find((i) => i.id === e.target.value);
                updateSection(index, {
                  ...section,
                  image: img
                    ? { id: img.id, src: img.url, alt: section.title }
                    : undefined,
                });
              }}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            >
              <option value="">No image</option>
              {productImages.map((img) => (
                <option key={img.id} value={img.id}>
                  {img.filename}
                </option>
              ))}
            </select>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={() =>
          onChange([
            ...value,
            {
              id: crypto.randomUUID(),
              title: "New section",
              body: [],
              bullets: [],
            },
          ])
        }
        className="inline-flex items-center gap-1 rounded-lg border border-dashed border-gray-300 px-4 py-2 text-sm hover:border-amber-400"
      >
        <Plus className="h-4 w-4" /> Add section
      </button>

      <ConfirmModal
        open={pendingRemoveIndex !== null}
        title="Remove description section?"
        description="This section will be removed from the product description."
        onCancel={() => setPendingRemoveIndex(null)}
        onConfirm={() => {
          if (pendingRemoveIndex === null) return;
          onChange(value.filter((_, i) => i !== pendingRemoveIndex));
          setPendingRemoveIndex(null);
        }}
      />
    </div>
  );
}
