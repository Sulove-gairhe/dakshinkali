"use client";

import Link from "next/link";
import type { CategoryRecord } from "@/lib/admin/types";

export function CategorySelect({
  categories,
  value,
  onChange,
}: {
  categories: CategoryRecord[];
  value: string | null;
  onChange: (categoryId: string, categoryName: string) => void;
}) {
  const active = categories.filter((c) => c.is_active);

  return (
    <div className="space-y-2">
      <select
        value={value ?? ""}
        onChange={(e) => {
          const cat = active.find((c) => c.id === e.target.value);
          if (cat) onChange(cat.id, cat.name);
        }}
        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
      >
        <option value="">Select category</option>
        {active.map((cat) => (
          <option key={cat.id} value={cat.id}>
            {cat.name}
          </option>
        ))}
      </select>
      <Link
        href="/admin/categories"
        className="text-xs font-medium text-primary hover:underline"
      >
        Manage categories →
      </Link>
    </div>
  );
}
