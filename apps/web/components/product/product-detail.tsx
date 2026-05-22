"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart, Scale } from "lucide-react";
import type { ProductDetailData } from "@/types/product";
import { ImageGallery } from "./image-gallery";
import { VariantSelector } from "./variant-selector";
import { DescriptionTabs } from "./description-tabs";

interface ProductDetailProps {
  product: ProductDetailData;
}

export function ProductDetail({ product }: ProductDetailProps) {
  const [quantity, setQuantity] = useState(1);

  return (
    <main className="min-h-screen bg-background">
      {/* Breadcrumb */}
      <div className="border-b border-border px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <nav className="flex items-center gap-2 text-sm">
            {product.breadcrumbs.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                {index > 0 && <span className="text-muted-foreground">/</span>}
                {item.href ? (
                <a
                    href={item.href}
                    className="text-foreground hover:text-foreground/80"
                  >
                    {item.label}
                  </a>
                ) : (
                  <span className="text-foreground">{item.label}</span>
                )}
              </div>
            ))}
          </nav>
        </div>
      </div>

      {/* Product Overview */}
      <div className="border-b border-border px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Left Column - Image Gallery */}
            <div>
              <ImageGallery images={product.images} badge={product.badge} />
            </div>

            {/* Right Column - Product Info */}
            <div className="flex flex-col gap-6">
              {/* Category & Title */}
              <div>
                <p className="mb-2 text-sm font-medium text-foreground">
                  {product.category}
                </p>
                <h1 className="text-3xl font-bold text-foreground">
                  {product.name}
                </h1>
                {product.ratingText && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    {product.ratingText}
                  </p>
                )}
              </div>

              {/* Wishlist & Compare */}
              <div className="flex gap-4 border-b border-border pb-6">
                  <button type="button" className="cursor-pointer flex items-center gap-2 text-sm font-medium text-foreground transition-colors hover:text-foreground/80">
                    <Heart className="h-5 w-5" />
                    Add to wishlist
                  </button>
                <Link href="/compare" className="cursor-pointer flex items-center gap-2 text-sm font-medium text-foreground transition-colors hover:text-foreground/80">
                  <Scale className="h-5 w-5" />
                  Compare
                </Link>
              </div>

              {/* Features */}
              {product.features.length > 0 && (
                <div className="border-b border-border pb-6">
                  <p className="mb-3 text-sm font-medium text-foreground">
                    Features:-
                  </p>
                  <ul className="space-y-2">
                    {product.features.map((feature, i) => (
                      <li
                        key={i}
                        className="flex gap-2 text-sm text-muted-foreground"
                      >
                        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Pricing */}
              <div className="border-b border-border pb-6">
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-bold text-foreground">
                    {product.currentPrice}
                  </span>
                  {product.oldPrice && (
                    <span className="text-lg font-bold text-foreground/55 line-through">
                      {product.oldPrice}
                    </span>
                  )}
                </div>
              </div>

              {/* Variants */}
              {product.variants && product.variants.length > 0 && (
                <div className="border-b border-border pb-6">
                  <div className="space-y-4">
                    {product.variants.map((variant) => (
                    <VariantSelector
                        key={variant.label}
                        label={variant.label}
                        options={variant.options}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity & CTA */}
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 rounded-lg border border-border">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="cursor-pointer px-4 py-2 text-lg font-semibold text-foreground hover:bg-muted"
                    >
                      −
                    </button>
                    <span className="w-12 text-center text-sm font-medium">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="cursor-pointer px-4 py-2 text-lg font-semibold text-foreground hover:bg-muted"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <button type="button" className="cursor-pointer flex-1 rounded-full bg-black py-3 font-semibold text-white transition-colors hover:bg-black/90">
                    Add to cart
                  </button>
                  <button type="button" className="cursor-pointer flex-1 rounded-full bg-black py-3 font-semibold text-white transition-colors hover:bg-black/90">
                    Buy Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Description Tabs */}
      <div className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <DescriptionTabs sections={product.descriptionSections} />
        </div>
      </div>
    </main>
  );
}
