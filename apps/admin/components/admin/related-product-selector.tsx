"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { searchProductsForRelated } from "@/lib/admin/actions/products";

export function RelatedProductSelector({
  value,
  onChange,
  excludeProductId,
}: {
  value: string[];
  onChange: (slugs: string[]) => void;
  excludeProductId?: string;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<
    { id: string; name: string; slug: string }[]
  >([]);
  const [labels, setLabels] = useState<Record<string, string>>({});

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim().length < 2) {
        setResults([]);
        return;
      }
      try {
        const items = await searchProductsForRelated(query);
        setResults(
          items.filter(
            (item) =>
              item.slug &&
              item.id !== excludeProductId &&
              !value.includes(item.slug),
          ),
        );
      } catch {
        setResults([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query, value, excludeProductId]);

  function addSlug(slug: string, name: string) {
    if (!slug || value.includes(slug)) return;
    setLabels((prev) => ({ ...prev, [slug]: name }));
    onChange([...value, slug]);
    setQuery("");
    setResults([]);
  }

  return (
    <div className="space-y-3">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search products by name or slug"
        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
      />
      {results.length > 0 ? (
        <ul className="max-h-40 overflow-auto rounded-lg border border-gray-200 bg-white shadow-sm">
          {results.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-sm hover:bg-primary/5"
                onClick={() => addSlug(item.slug, item.name)}
              >
                <span className="font-medium">{item.name}</span>
                <span className="ml-2 text-xs text-gray-500">{item.slug}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {value.map((slug) => (
          <span
            key={slug}
            className="inline-flex items-center gap-1 rounded-full bg-primary/5 px-3 py-1 text-xs text-primary ring-1 ring-primary/20"
          >
            {labels[slug] ?? slug}
            <button
              type="button"
              onClick={() => onChange(value.filter((s) => s !== slug))}
              aria-label="Remove"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}
