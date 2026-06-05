"use client";

import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import type { ProductSpecificationGroup } from "@/lib/admin/types";

export function SpecificationBuilder({
  value,
  onChange,
}: {
  value: ProductSpecificationGroup[];
  onChange: (groups: ProductSpecificationGroup[]) => void;
}) {
  function updateGroup(index: number, group: ProductSpecificationGroup) {
    const next = [...value];
    next[index] = group;
    onChange(next);
  }

  return (
    <div className="space-y-4">
      {value.map((group, groupIndex) => (
        <div
          key={groupIndex}
          className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
        >
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={group.title}
              onChange={(e) =>
                updateGroup(groupIndex, { ...group, title: e.target.value })
              }
              placeholder="Group title"
              className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
            <button
              type="button"
              disabled={groupIndex === 0}
              onClick={() => {
                const next = [...value];
                [next[groupIndex - 1], next[groupIndex]] = [
                  next[groupIndex],
                  next[groupIndex - 1],
                ];
                onChange(next);
              }}
              className="rounded p-1 text-gray-500 hover:bg-gray-100 disabled:opacity-30"
            >
              <ChevronUp className="h-4 w-4" />
            </button>
            <button
              type="button"
              disabled={groupIndex === value.length - 1}
              onClick={() => {
                const next = [...value];
                [next[groupIndex], next[groupIndex + 1]] = [
                  next[groupIndex + 1],
                  next[groupIndex],
                ];
                onChange(next);
              }}
              className="rounded p-1 text-gray-500 hover:bg-gray-100 disabled:opacity-30"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => onChange(value.filter((_, i) => i !== groupIndex))}
              className="rounded p-1 text-red-500 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-3 space-y-2">
            {group.specs.map((spec, specIndex) => (
              <div key={specIndex} className="flex gap-2">
                <input
                  type="text"
                  value={spec.label}
                  onChange={(e) => {
                    const specs = [...group.specs];
                    specs[specIndex] = { ...spec, label: e.target.value };
                    updateGroup(groupIndex, { ...group, specs });
                  }}
                  placeholder="Label"
                  className="w-1/3 rounded-lg border border-gray-200 px-2 py-1.5 text-sm"
                />
                <input
                  type="text"
                  value={spec.value}
                  onChange={(e) => {
                    const specs = [...group.specs];
                    specs[specIndex] = { ...spec, value: e.target.value };
                    updateGroup(groupIndex, { ...group, specs });
                  }}
                  placeholder="Value"
                  className="flex-1 rounded-lg border border-gray-200 px-2 py-1.5 text-sm"
                />
                <button
                  type="button"
                  onClick={() =>
                    updateGroup(groupIndex, {
                      ...group,
                      specs: group.specs.filter((_, i) => i !== specIndex),
                    })
                  }
                  className="text-gray-400 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                updateGroup(groupIndex, {
                  ...group,
                  specs: [...group.specs, { label: "", value: "" }],
                })
              }
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              <Plus className="h-4 w-4" /> Add Spec
            </button>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={() =>
          onChange([...value, { title: "New Group", specs: [{ label: "", value: "" }] }])
        }
        className="rounded-lg border border-dashed border-gray-300 px-4 py-2 text-sm text-gray-700 hover:border-primary/50 hover:text-primary"
      >
        Add Group
      </button>
    </div>
  );
}
