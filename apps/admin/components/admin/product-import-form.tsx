"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Upload } from "lucide-react";
import { toast } from "sonner";
import {
  commitProductImport,
  previewProductImport,
} from "@/lib/admin/actions/product-import";
import type {
  ProductImportPreviewRow,
  ProductImportCommitSummary,
  ProductImportPreview,
} from "@/lib/admin/product-import/schema";
import { ProductImportPreviewTable } from "./product-import-preview";

export function ProductImportForm() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ProductImportPreview | null>(null);
  const [summary, setSummary] = useState<ProductImportCommitSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [committing, setCommitting] = useState(false);

  async function handlePreview() {
    if (!file) {
      toast.error("Choose a CSV file");
      return;
    }

    setLoading(true);
    setSummary(null);
    try {
      const formData = new FormData();
      formData.set("file", file);
      const result = await previewProductImport(formData);
      if (!result.ok || !result.preview) {
        toast.error(result.errors?.join(", ") ?? "Could not parse CSV");
        return;
      }
      setPreview(result.preview);
      toast.success("Preview ready");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Import preview failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleCommit() {
    if (!preview) return;

    setCommitting(true);
    try {
      const result = await commitProductImport({
        rows: preview.rows.map(sanitizeRowForCommit),
      });
      setSummary(result);
      toast.success(
        `Imported ${result.createdDraft + result.updatedDraft} draft rows`,
      );
      router.push("/admin/products");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Import failed");
    } finally {
      setCommitting(false);
    }
  }

  function handleBrandChange(rowNumber: number, brand: string) {
    setPreview((current) => {
      if (!current) return current;

      return {
        ...current,
        rows: current.rows.map((row) =>
          row.rowNumber === rowNumber
            ? { ...row, brandGuess: brand || null }
            : row,
        ),
      };
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/admin/products"
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Products
        </Link>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <label className="text-sm font-medium text-gray-700">
              CSV file
            </label>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={(event) => {
                setFile(event.target.files?.[0] ?? null);
                setPreview(null);
              }}
              className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
            />
          </div>
          <button
            type="button"
            disabled={loading || !file}
            onClick={() => void handlePreview()}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Upload className="h-4 w-4" />
            {loading ? "Parsing..." : "Preview"}
          </button>
        </div>
      </div>

      {preview ? (
        <ProductImportPreviewTable
          preview={preview}
          committing={committing}
          summary={summary}
          onCommit={() => void handleCommit()}
          onBrandChange={handleBrandChange}
        />
      ) : null}
    </div>
  );
}

function finiteOrNull(value: number | null) {
  return value !== null && Number.isFinite(value) ? value : null;
}

function sanitizeRowForCommit(row: ProductImportPreviewRow): ProductImportPreviewRow {
  return {
    ...row,
    salesPrice: finiteOrNull(row.salesPrice),
    purchasePrice: finiteOrNull(row.purchasePrice),
    brandGuess: row.brandGuess?.trim() || null,
    mrp: finiteOrNull(row.mrp),
    wholesalePrice: finiteOrNull(row.wholesalePrice),
    quantity: Number.isFinite(row.quantity) ? row.quantity : 0,
    stockValue: finiteOrNull(row.stockValue),
    computedStockValue: finiteOrNull(row.computedStockValue),
  };
}
