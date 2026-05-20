"use client";

import { useEffect } from "react";
import { useCompare } from "./CompareProvider";
import { CompareMatrix } from "./CompareMatrix";
import { getCategoryComparisonTitle } from "@/lib/compare-utils";
import { X, Trash2, GitCompareArrows } from "lucide-react";

export function CompareModal() {
  const { isCompareModalOpen, closeModal, clearAll, selectedProducts, lockedCategory } = useCompare();

  // Close on Escape key
  useEffect(() => {
    if (!isCompareModalOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };

    // Prevent body scroll when modal is open
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isCompareModalOpen, closeModal]);

  if (!isCompareModalOpen || selectedProducts.length === 0) return null;

  const comparisonTitle = lockedCategory
    ? getCategoryComparisonTitle(lockedCategory)
    : "Product Comparison";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Compare Products"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={closeModal}
        aria-hidden="true"
      />

      {/* Modal content */}
      <div className="relative z-10 mx-auto mt-4 flex h-[calc(100vh-2rem)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl sm:mt-8 sm:h-[calc(100vh-4rem)] sm:mx-4">
        {/* Modal header */}
        <div className="flex shrink-0 items-center justify-between border-b border-border bg-card px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <GitCompareArrows className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground sm:text-xl">Compare Products</h2>
              <p className="text-xs font-medium text-muted-foreground">{comparisonTitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={clearAll}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
              aria-label="Clear all and close"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Clear all</span>
            </button>
            <button
              type="button"
              onClick={closeModal}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Close comparison modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Scrollable matrix */}
        <div className="flex-1 overflow-auto">
          <CompareMatrix />
        </div>
      </div>
    </div>
  );
}
