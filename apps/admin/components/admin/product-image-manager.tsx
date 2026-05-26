"use client";

import { useCallback, useState } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";
import { GripVertical, ImageIcon, Trash2 } from "lucide-react";
import { ConfirmModal } from "./confirm-modal";
import {
  deleteProductImage,
  uploadProductImage,
  validateImageFile,
} from "@/lib/admin/storage";
import type { ProductImageRecord } from "@/lib/admin/types";

const MAX_IMAGES = 5;

export function ProductImageManager({
  productId,
  images,
  onChange,
}: {
  productId: string;
  images: ProductImageRecord[];
  onChange: (images: ProductImageRecord[]) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<ProductImageRecord | null>(
    null,
  );

  const sorted = [...images].sort((a, b) => a.order - b.order);

  const onDrop = useCallback(
    async (files: FileList | null) => {
      if (!files?.length) return;
      setError(null);
      if (sorted.length >= MAX_IMAGES) {
        setError("Max 5 images reached");
        return;
      }

      setUploading(true);
      try {
        const next = [...sorted];
        for (const file of Array.from(files)) {
          if (next.length >= MAX_IMAGES) {
            setError("Max 5 images reached");
            break;
          }
          const validation = validateImageFile(file);
          if (validation) {
            setError(validation);
            continue;
          }
          // TODO: compress image before upload using browser-image-compression
          const uploaded = await uploadProductImage(
            productId,
            file,
            next.length,
          );
          next.push(uploaded);
        }
        onChange(next.map((img, index) => ({ ...img, order: index })));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [sorted, productId, onChange],
  );

  function handleDragEnd(result: DropResult) {
    if (!result.destination) return;
    const items = [...sorted];
    const [removed] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, removed);
    onChange(items.map((img, index) => ({ ...img, order: index })));
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    try {
      if (pendingDelete.storagePath) {
        await deleteProductImage(pendingDelete.storagePath);
      }
      const remaining = sorted
        .filter((img) => img.id !== pendingDelete.id)
        .map((img, index) => ({ ...img, order: index }));
      onChange(remaining);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setPendingDelete(null);
    }
  }

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          void onDrop(e.dataTransfer.files);
        }}
        className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 px-6 py-10 text-center"
      >
        <p className="text-sm text-gray-600">
          Drag and drop images, or{" "}
          <label className="cursor-pointer font-medium text-amber-700 hover:underline">
            browse
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              disabled={uploading || sorted.length >= MAX_IMAGES}
              onChange={(e) => void onDrop(e.target.files)}
            />
          </label>
        </p>
        <p className="mt-1 text-xs text-gray-500">
          JPEG, PNG, WebP · max 5MB each · up to {MAX_IMAGES} images
        </p>
        {uploading ? (
          <p className="mt-2 text-xs text-amber-700">Uploading…</p>
        ) : null}
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="product-images" direction="horizontal">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="flex flex-wrap gap-3"
            >
              {sorted.map((img, index) => (
                <Draggable key={img.id} draggableId={img.id} index={index}>
                  {(dragProvided) => (
                    <div
                      ref={dragProvided.innerRef}
                      {...dragProvided.draggableProps}
                      className="w-36 rounded-lg border border-gray-200 bg-white p-2 shadow-sm"
                    >
                      <div className="relative aspect-square overflow-hidden rounded-md bg-gray-100">
                        {img.url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={img.url}
                            alt={img.filename}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <ImageIcon className="h-8 w-8 text-gray-400" />
                          </div>
                        )}
                        {index === 0 ? (
                          <span className="absolute left-1 top-1 rounded bg-amber-500 px-1.5 py-0.5 text-[10px] font-semibold text-gray-900">
                            Primary
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-2 flex items-start justify-between gap-1">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs text-gray-700">
                            {img.filename}
                          </p>
                          <p className="text-[10px] text-gray-500">
                            Order {index + 1}
                          </p>
                        </div>
                        <div className="flex flex-col gap-1">
                          <button
                            type="button"
                            {...dragProvided.dragHandleProps}
                            className="text-gray-400 hover:text-gray-700"
                          >
                            <GripVertical className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setPendingDelete(img)}
                            className="text-gray-400 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <ConfirmModal
        open={!!pendingDelete}
        title="Delete image?"
        description="This will remove the image from storage and the product gallery."
        confirmLabel="Delete image"
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}
