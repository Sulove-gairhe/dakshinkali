"use client";

import { useState } from "react";
import Image from "next/image";

interface ImageGalleryProps {
  images: { id: string; src: string; alt: string }[];
  badge?: string;
}

export function ImageGallery({ images, badge }: ImageGalleryProps) {
  const [selectedImageId, setSelectedImageId] = useState(images[0]?.id);
  const selectedImage = images.find((img) => img.id === selectedImageId);

  return (
    <div className="flex flex-col gap-4">
      {/* Main Image */}
      <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-muted">
        {badge && (
          <div className="absolute left-4 top-4 z-10 rounded bg-red-500 px-3 py-1 text-sm font-bold text-white">
            {badge}
          </div>
        )}
        {selectedImage && (
          <Image
            src={selectedImage.src}
            alt={selectedImage.alt}
            fill
            className="object-contain"
            priority
          />
        )}
      </div>

      {/* Thumbnail Gallery */}
      <div className="grid grid-cols-5 gap-3 px-1 py-1">
        {images.map((image) => (
          <button
            key={image.id}
            onClick={() => setSelectedImageId(image.id)}
            className={`relative m-1 aspect-square cursor-pointer overflow-hidden rounded-lg border-2 transition-all duration-200 hover:scale-[1.03] active:scale-[0.98] ${
              selectedImageId === image.id
                ? "border-foreground"
                : "border-border hover:border-muted-foreground"
            }`}
          >
            <Image
              src={image.src}
              alt={image.alt}
              fill
              className="object-contain"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
