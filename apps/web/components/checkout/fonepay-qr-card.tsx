"use client";

import Image from "next/image";
import { Download, X, Upload, FileText, AlertCircle, Info } from "lucide-react";
import { useState, useRef, useCallback } from "react";

interface FonepayQrCardProps {
  file: File | null;
  onChangeFile: (file: File | null) => void;
  error?: string | null;
}

const QR_IMAGES = [
  { src: "/images/dakshinkali qr code.jpeg", label: "Fonepay QR Code" },
  { src: "/images/dakshinkali qr code ss.jpeg", label: "Fonepay QR Screenshot" },
];

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/jpg", "application/pdf"];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export function FonepayQrCard({ file, onChangeFile, error }: FonepayQrCardProps) {
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownload = useCallback((src: string, filename: string) => {
    const link = document.createElement("a");
    link.href = src;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setUploadError(null);
      const selected = e.target.files?.[0];
      if (!selected) return;

      if (!ACCEPTED_TYPES.includes(selected.type)) {
        setUploadError("Only PNG, JPEG, and PDF files are accepted.");
        return;
      }

      if (selected.size > MAX_FILE_SIZE) {
        setUploadError("File size must be 5MB or less.");
        return;
      }

      onChangeFile(selected);
    },
    [onChangeFile],
  );

  const handleRemoveFile = useCallback(() => {
    onChangeFile(null);
    setUploadError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [onChangeFile]);

  const displayError = error || uploadError;

  return (
    <div className="rounded-xl border border-border/60 bg-white p-5 mt-4 space-y-5 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="flex gap-3 items-start bg-primary/5 p-3 rounded-lg border border-primary/15">
        <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div className="text-xs text-muted-foreground leading-relaxed">
          <span className="font-bold text-foreground">Payment Flow:</span> Scan one of the QR codes below using your banking app or Fonepay-supported wallet. After payment, upload a screenshot or PDF proof. Our admin team will verify the payment before delivery.
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {QR_IMAGES.map((qr, index) => (
          <div key={index} className="flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={() => setPreviewIndex(index)}
              className="relative h-48 w-48 p-2 bg-white rounded-xl shadow-md border border-border flex items-center justify-center overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
            >
              <Image
                src={qr.src}
                alt={qr.label}
                width={180}
                height={180}
                className="object-contain"
                priority={index === 0}
              />
            </button>
            <button
              type="button"
              onClick={() => handleDownload(qr.src, `${qr.label.toLowerCase().replace(/\s+/g, "-")}.jpeg`)}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/90 transition-colors text-xs font-semibold cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              Download
            </button>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
          <Upload className="h-4 w-4 text-muted-foreground" />
          Upload Payment Proof <span className="text-destructive">*</span>
        </label>

        {file ? (
          <div className="flex items-center gap-3 p-3 rounded-lg border border-primary/40 bg-primary/5">
            <FileText className="h-5 w-5 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <button
              type="button"
              onClick={handleRemoveFile}
              className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center gap-2 p-6 rounded-lg border-2 border-dashed border-border bg-background hover:border-primary/50 hover:bg-muted/30 transition-colors cursor-pointer"
          >
            <Upload className="h-6 w-6 text-muted-foreground" />
            <div className="text-sm font-medium text-muted-foreground">
              Click to upload proof
            </div>
            <p className="text-xs text-muted-foreground">
              PNG, JPEG, or PDF (max 5MB)
            </p>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept=".png,.jpg,.jpeg,.pdf"
          onChange={handleFileSelect}
          className="hidden"
        />

        {displayError && (
          <p className="text-xs text-destructive mt-1 font-medium flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {displayError}
          </p>
        )}
      </div>

      {previewIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setPreviewIndex(null)}
        >
          <div
            className="relative max-w-lg max-h-[90vh] bg-white rounded-2xl p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPreviewIndex(null)}
              className="absolute -top-3 -right-3 h-8 w-8 rounded-full bg-background border border-border shadow-md flex items-center justify-center hover:bg-muted transition-colors cursor-pointer z-10"
            >
              <X className="h-4 w-4" />
            </button>
            <Image
              src={QR_IMAGES[previewIndex].src}
              alt={QR_IMAGES[previewIndex].label}
              width={500}
              height={500}
              className="object-contain rounded-lg"
            />
            <p className="text-center text-sm font-semibold text-foreground mt-3">
              {QR_IMAGES[previewIndex].label}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
