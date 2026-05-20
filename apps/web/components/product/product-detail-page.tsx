"use client";

import Image from "next/image";
import { useState } from "react";

const product = {
  name: "Samsung 55 DU 4K UHD Smart TV",
  slug: "samsung-55-du-4k-uhd-smart-tv",
  category: "Televisions",
  price: 62000,
  oldPrice: 78000,
  rating: 4.8,
  reviewCount: 11,
  badge: "Best Seller",
  images: [
    "/placeholder.svg",
    "/placeholder.svg",
    "/placeholder.svg",
    "/placeholder.svg",
  ],
  features: [
    "55-inch Crystal UHD 4K display",
    "Smart TV with built-in streaming apps",
    "HDR support for improved contrast",
    "Multiple HDMI and USB ports",
    "Slim modern design suitable for home entertainment",
  ],
  description: `The Samsung 55 DU 4K UHD Smart TV delivers stunning visuals and smart features for your home entertainment. Enjoy vibrant colors, deep contrast, and seamless streaming with built-in apps.`,
};

const TABS = ["Description", "Specification", "Reviews"];

export default function ProductDetailPage() {
  const [selectedImage, setSelectedImage] = useState(product.images[0]);
  const [tab, setTab] = useState("Description");

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,560px)_1fr]">
          {/* Gallery */}
          <div>
            <div className="aspect-square max-h-[560px] rounded-2xl bg-muted p-6 flex items-center justify-center">
              <Image
                src={selectedImage}
                alt={product.name}
                width={600}
                height={600}
                className="h-full w-full object-contain"
                priority
              />
            </div>
            <div className="mt-4 flex gap-2">
              {product.images.map((img, i) => (
                <button
                  key={img + i}
                  className={`rounded-lg border p-1 bg-white ${selectedImage === img ? "ring-2 ring-primary" : ""} cursor-pointer`}
                  onClick={() => setSelectedImage(img)}
                  aria-label={`Show image ${i + 1}`}
                >
                  <Image
                    src={img}
                    alt={product.name}
                    width={64}
                    height={64}
                    className="object-contain"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Info */}
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-block rounded bg-yellow-400 px-2 py-1 text-xs font-semibold text-black">
                {product.badge}
              </span>
              <span className="text-sm text-muted-foreground">
                {product.category}
              </span>
            </div>
            <h1 className="text-2xl font-bold mb-2">{product.name}</h1>
            <div className="flex items-center gap-4 mb-4">
              <span className="text-2xl font-semibold text-primary">
                Rs {product.price.toLocaleString()}
              </span>
              <span className="text-lg line-through text-muted-foreground">
                Rs {product.oldPrice.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-yellow-500 font-bold">
                ★ {product.rating}
              </span>
              <span className="text-sm text-muted-foreground">
                ({product.reviewCount} reviews)
              </span>
            </div>
            <ul className="mb-6 list-disc pl-5 text-sm text-muted-foreground">
              {product.features.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
            <div className="flex gap-4 mb-6">
              <button className="cursor-pointer rounded-md bg-primary px-6 py-3 font-medium text-primary-foreground">
                Add to Cart
              </button>
              <button className="cursor-pointer rounded-md bg-yellow-400 px-6 py-3 font-medium text-black">
                Buy Now
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-10">
          <div className="flex gap-4 border-b border-border mb-4">
            {TABS.map((t) => (
              <button
                key={t}
                className={`cursor-pointer px-4 py-2 font-medium border-b-2 transition-colors ${tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-primary"}`}
                onClick={() => setTab(t)}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="min-h-[120px]">
            {tab === "Description" && (
              <section>
                <h2 className="text-lg font-semibold mb-2">
                  Product Description
                </h2>
                <p className="mb-4">{product.description}</p>
                <ul className="list-disc pl-5 text-sm text-muted-foreground">
                  {product.features.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
              </section>
            )}
            {tab === "Specification" && (
              <div>Product specifications will be added soon.</div>
            )}
            {tab === "Reviews" && (
              <div>Customer reviews will be available soon.</div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
