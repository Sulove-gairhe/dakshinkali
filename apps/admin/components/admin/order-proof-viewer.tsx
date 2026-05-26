"use client";

import { useState } from "react";
import { ExternalLink, Upload } from "lucide-react";
import { toast } from "sonner";
import {
  isImageProofType,
  isPdfProofType,
} from "@/lib/admin/order-utils";
import { uploadOrderProof } from "@/lib/admin/actions/orders";

export function OrderProofViewer({
  orderId,
  proofUrl,
  proofType,
  onUploaded,
}: {
  orderId: string;
  proofUrl: string | null;
  proofType: string | null;
  onUploaded: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function handleUpload(file: File) {
    setUploading(true);
    const formData = new FormData();
    formData.set("orderId", orderId);
    formData.set("file", file);
    const result = await uploadOrderProof(formData);
    setUploading(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Proof uploaded");
    onUploaded();
  }

  if (!proofUrl) {
    return (
      <div className="flex h-full min-h-[280px] flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
        <p className="text-sm font-medium text-gray-700">Proof not yet uploaded</p>
        <p className="mt-1 text-xs text-gray-500">
          {/* TODO: Remove manual upload once checkout populates proof_file_url */}
          Checkout may store proof metadata in notes until the upload pipeline is wired.
        </p>
        <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-amber-400">
          <Upload className="h-4 w-4" />
          {uploading ? "Uploading…" : "Upload proof manually"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            className="hidden"
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleUpload(file);
            }}
          />
        </label>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex justify-end">
        <a
          href={proofUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Open in new tab
        </a>
      </div>

      <div className="relative flex flex-1 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
        {loading && !error ? (
          <div className="absolute inset-0 animate-pulse bg-gray-200" />
        ) : null}

        {isImageProofType(proofType) ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={proofUrl}
            alt="Payment proof"
            className="max-h-[70vh] w-full object-contain"
            onLoad={() => {
              setLoading(false);
              setError(false);
            }}
            onError={() => {
              setLoading(false);
              setError(true);
            }}
          />
        ) : isPdfProofType(proofType) ? (
          <div className="flex w-full flex-col gap-3 p-4">
            <a
              href={proofUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-gray-900"
            >
              Open PDF in new tab
            </a>
            <iframe
              src={proofUrl}
              title="Payment proof PDF"
              className="h-[60vh] w-full rounded-lg border border-gray-200"
              onLoad={() => setLoading(false)}
            />
          </div>
        ) : (
          <div className="p-6 text-center text-sm text-gray-600">
            <p>File type unknown — open in new tab</p>
            <a
              href={proofUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-amber-700 underline"
            >
              {proofUrl}
            </a>
          </div>
        )}

        {error ? (
          <p className="absolute bottom-4 text-sm text-red-600">
            Failed to load proof preview
          </p>
        ) : null}
      </div>
    </div>
  );
}
