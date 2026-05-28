"use client";

import { useState } from "react";
import { X } from "lucide-react";

export function StringArrayEditor({
  value,
  onChange,
  placeholder = "Add item",
  maxItems,
}: {
  value: string[];
  onChange: (val: string[]) => void;
  placeholder?: string;
  maxItems?: number;
}) {
  const [draft, setDraft] = useState("");

  function addItem() {
    const trimmed = draft.trim();
    if (!trimmed) return;
    if (maxItems && value.length >= maxItems) return;
    onChange([...value, trimmed]);
    setDraft("");
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addItem();
            }
          }}
          placeholder={placeholder}
          className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
        />
        <button
          type="button"
          onClick={addItem}
          disabled={maxItems !== undefined && value.length >= maxItems}
          className="rounded-lg bg-amber-500 px-3 py-2 text-sm font-medium text-gray-900 hover:bg-amber-400 disabled:opacity-50"
        >
          Add
        </button>
      </div>
      {maxItems ? (
        <p className="text-xs text-gray-500">
          {value.length}/{maxItems} items
        </p>
      ) : null}
      <ul className="space-y-2">
        {value.map((item, index) => (
          <li
            key={`${item}-${index}`}
            className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm"
          >
            <span>{item}</span>
            <button
              type="button"
              onClick={() => onChange(value.filter((_, i) => i !== index))}
              className="text-gray-500 hover:text-red-600"
              aria-label="Remove"
            >
              <X className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
