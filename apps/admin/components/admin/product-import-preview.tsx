"use client";

import type {
  ProductImportCommitSummary,
  ProductImportPreview,
} from "@/lib/admin/product-import/schema";

function formatNumber(value: number | null) {
  if (value === null || Number.isNaN(value)) return "—";
  return value.toLocaleString("en-NP");
}

export function ProductImportPreviewTable({
  preview,
  committing,
  summary,
  onCommit,
  onBrandChange,
}: {
  preview: ProductImportPreview;
  committing: boolean;
  summary: ProductImportCommitSummary | null;
  onCommit: () => void;
  onBrandChange: (rowNumber: number, brand: string) => void;
}) {
  const validCount = preview.rows.filter((row) => row.valid).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white p-3">
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded bg-green-50 px-2 py-1 font-medium text-green-700">
            Created draft {preview.summary.createdDraft}
          </span>
          <span className="rounded bg-blue-50 px-2 py-1 font-medium text-blue-700">
            Updated draft {preview.summary.updatedDraft}
          </span>
          <span className="rounded bg-gray-100 px-2 py-1 font-medium text-gray-700">
            Skipped {preview.summary.skipped}
          </span>
          <span className="rounded bg-primary/10 px-2 py-1 font-medium text-primary">
            Warnings {preview.summary.warnings}
          </span>
          <span className="rounded bg-red-50 px-2 py-1 font-medium text-red-700">
            Errors {preview.summary.errors}
          </span>
        </div>
        <button
          type="button"
          disabled={committing || validCount === 0}
          onClick={onCommit}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {committing ? "Importing..." : `Commit ${validCount} valid rows`}
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="min-w-[1100px] w-full text-left text-xs">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-3 py-2">Row</th>
              <th className="px-3 py-2">Item name</th>
              <th className="px-3 py-2">Model</th>
              <th className="px-3 py-2">Brand</th>
              <th className="px-3 py-2">Sales</th>
              <th className="px-3 py-2">Purchase</th>
              <th className="px-3 py-2">Wholesale</th>
              <th className="px-3 py-2">Qty</th>
              <th className="px-3 py-2">Stock value</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Messages</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {preview.rows.map((row) => (
              <tr key={row.rowNumber} className={row.valid ? "" : "bg-red-50/40"}>
                <td className="px-3 py-2 font-medium">{row.rowNumber}</td>
                <td className="max-w-[220px] px-3 py-2">{row.itemName}</td>
                <td className="px-3 py-2">{row.modelName ?? "—"}</td>
                <td className="min-w-[160px] px-3 py-2">
                  <input
                    type="text"
                    value={row.brandGuess ?? ""}
                    onChange={(event) =>
                      onBrandChange(row.rowNumber, event.target.value)
                    }
                    disabled={committing}
                    aria-label={`Brand for row ${row.rowNumber}`}
                    placeholder="Brand"
                    className="h-9 w-full rounded-md border border-gray-200 bg-white px-2 text-xs text-gray-800 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </td>
                <td className="px-3 py-2">{formatNumber(row.salesPrice)}</td>
                <td className="px-3 py-2">{formatNumber(row.purchasePrice)}</td>
                <td className="px-3 py-2">{formatNumber(row.wholesalePrice)}</td>
                <td className="px-3 py-2">{formatNumber(row.quantity)}</td>
                <td className="px-3 py-2">{formatNumber(row.computedStockValue)}</td>
                <td className="px-3 py-2">
                  <span
                    className={
                      row.action === "error"
                        ? "rounded bg-red-100 px-2 py-1 font-medium text-red-700"
                        : row.action === "skipped"
                          ? "rounded bg-gray-100 px-2 py-1 font-medium text-gray-700"
                        : row.action === "update draft"
                          ? "rounded bg-blue-100 px-2 py-1 font-medium text-blue-700"
                          : "rounded bg-green-100 px-2 py-1 font-medium text-green-700"
                    }
                  >
                    {row.action}
                  </span>
                </td>
                <td className="max-w-[280px] px-3 py-2 text-gray-600">
                  {[...row.errors, ...row.warnings].join("; ") || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {summary ? (
        <div className="rounded-lg border border-gray-200 bg-white p-3 text-sm">
          <p className="font-semibold text-gray-800">
            Created draft {summary.createdDraft}, updated draft{" "}
            {summary.updatedDraft}, skipped {summary.skipped}, errors{" "}
            {summary.errors}, warnings {summary.warnings}
          </p>
          {summary.errorRows.length > 0 ? (
            <textarea
              readOnly
              value={summary.errorRows
                .map((error) =>
                  `${error.rowNumber},${error.itemName},"${error.messages.join("; ").replace(/"/g, '""')}"`,
                )
                .join("\n")}
              className="mt-3 h-28 w-full rounded-lg border border-gray-200 p-2 font-mono text-xs"
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
