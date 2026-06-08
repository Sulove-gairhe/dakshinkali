"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, Scale, ShoppingCart } from "lucide-react";
import type { ProductImage, StoreProduct } from "@/lib/store-products";
import {
  getRecommendedProducts,
  parseProductPrice,
} from "@/lib/store-products";
import { useCart } from "@/components/cart-provider";
import { ImageGallery } from "./image-gallery";
import { VariantSelector } from "./variant-selector";
import { DescriptionTabs } from "./description-tabs";
import { SimilarProducts } from "./similar-products";
import { Footer } from "@/components/layout/Footer";

interface ProductDetailProps {
  product: StoreProduct;
}

export function ProductDetail({ product }: ProductDetailProps) {
  const router = useRouter();
  const { addItem, getQuantity } = useCart();
  const [quantity, setQuantity] = useState(1);
  const badge = product.badge ?? product.badges?.[0];
  const images = getProductImages(product);
  const features =
    product.highlights && product.highlights.length > 0
      ? product.highlights
      : [product.shortDescription].filter(Boolean);
  const descriptionSections =
    product.descriptionSections && product.descriptionSections.length > 0
      ? product.descriptionSections
      : [
          {
            id: "overview",
            title: "Product Overview",
            body: [product.shortDescription],
          },
        ];
  const breadcrumbs = [
    { label: "Home", href: "/" },
    {
      label: product.category,
      href: `/categories/${encodeURIComponent(product.category)}`,
    },
    { label: product.name },
  ];

  const recommendations = getRecommendedProducts(product, { limit: 8 });

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addItem({
        id: product.id,
        slug: product.slug,
        name: product.name,
        shortDescription: product.shortDescription,
        image: product.image,
        currentPrice: product.currentPrice,
        oldPrice: product.oldPrice,
        href: `/products/${product.slug}`,
        price: parseProductPrice(product.currentPrice),
        category: product.category,
        categoryId: product.categoryId ?? null,
      });
    }
    setQuantity(1);
  };

  const handleBuyNow = () => {
    handleAddToCart();
    router.push("/checkout");
  };

  return (
    <main className="min-h-screen bg-background">
      {/* Breadcrumb */}
      <div className="border-b border-border px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <nav className="flex items-center gap-2 text-sm">
            {breadcrumbs.map((item, index) => (
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

      {/* Product Overview — clean 2-col: image | info */}
      <div className="border-b border-border px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Image Gallery */}
            <div>
              <ImageGallery images={images} badge={badge} />
            </div>

            {/* Product Info */}
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
                <button className="cursor-pointer flex items-center gap-2 text-sm font-medium text-foreground transition-colors hover:text-foreground/80">
                  <Heart className="h-5 w-5" />
                  Add to wishlist
                </button>
                <button className="cursor-pointer flex items-center gap-2 text-sm font-medium text-foreground transition-colors hover:text-foreground/80">
                  <Scale className="h-5 w-5" />
                  Compare
                </button>
              </div>

              {/* Features */}
              {features.length > 0 && (
                <div className="border-b border-border pb-6">
                  <p className="mb-3 text-sm font-medium text-foreground">
                    Features:-
                  </p>
                  <ul className="space-y-2">
                    {features.map((feature, i) => (
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
                  <button
                    onClick={handleAddToCart}
                    className="cursor-pointer flex-1 rounded-full bg-black py-3 font-semibold text-white transition-colors hover:bg-black/90"
                  >
                    Add to cart
                  </button>
                  <button
                    onClick={handleBuyNow}
                    className="cursor-pointer flex-1 rounded-full bg-black py-3 font-semibold text-white transition-colors hover:bg-black/90"
                  >
                    Buy Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Description Tabs + Similar Products */}
      <div className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-[1460px] gap-8 lg:grid-cols-[minmax(0,1fr)_240px] lg:gap-12 xl:gap-16">
          <div className="min-w-0">
            <DescriptionTabs
              sections={descriptionSections}
              specifications={product.specifications}
              boxContents={product.boxContents}
              deliveryInfo={product.deliveryInfo}
            />
            <SimilarProducts products={recommendations} />
          </div>

          <CurrentProductPreview
            product={product}
            quantityInCart={getQuantity(product.id)}
            onAddToCart={() =>
              addItem({
                id: product.id,
                slug: product.slug,
                name: product.name,
                shortDescription: product.shortDescription,
                image: product.image,
                currentPrice: product.currentPrice,
                oldPrice: product.oldPrice,
                href: `/products/${product.slug}`,
                price: parseProductPrice(product.currentPrice),
                category: product.category,
                categoryId: product.categoryId ?? null,
              })
            }
          />
        </div>
      </div>
      <Footer />
    </main>
  );
}

function CurrentProductPreview({
  product,
  quantityInCart,
  onAddToCart,
}: {
  product: StoreProduct;
  quantityInCart: number;
  onAddToCart: () => void;
}) {
  const color = getProductColor(product);

  return (
    <aside className="block lg:sticky lg:top-24 lg:justify-self-end lg:self-start xl:translate-x-4 2xl:translate-x-8">
      <article className="relative mx-auto flex h-[430px] w-[240px] overflow-hidden rounded-xl border border-border bg-card shadow-lg lg:mx-0">
        <div className="flex w-full flex-col">
          <div className="relative aspect-square w-full overflow-hidden bg-white p-3">
            <span className="absolute left-3 top-3 z-10 rounded-md bg-accent/15 px-2 py-0.5 text-[10px] font-bold text-primary ring-1 ring-accent/30">
              Viewing
            </span>
            <Image
              src={product.image}
              alt={product.name}
              fill
              sizes="240px"
              className="object-contain"
            />
          </div>

          <div className="flex min-w-0 flex-1 flex-col p-3">
            <p className="text-xs font-semibold text-muted-foreground">
              {product.brand ?? product.category}
            </p>
            <h3 className="mt-1 line-clamp-2 text-sm font-bold leading-snug text-foreground">
              {product.name}
            </h3>

            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-base font-bold text-gray-950">
                {product.currentPrice}
              </span>
              {product.oldPrice && (
                <span className="text-xs text-muted-foreground line-through">
                  {product.oldPrice}
                </span>
              )}
            </div>

            <div className="mt-2 flex items-center gap-2 rounded-lg border border-border bg-background px-2.5 py-2">
              <span
                className="h-4 w-4 shrink-0 rounded-full border border-border shadow-inner"
                style={{ backgroundColor: getColorSwatch(color) }}
              />
              <span className="truncate text-xs font-semibold text-foreground">
                {color ?? "As shown"}
              </span>
            </div>

            {product.status && (
              <p className="mt-2 text-xs font-semibold text-muted-foreground">
                {product.status}
              </p>
            )}

            <div className="flex-1" />

            <button
              type="button"
              onClick={onAddToCart}
              className="mt-3 inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-accent/45 bg-white px-3 py-2.5 text-xs font-semibold text-primary shadow-sm transition-colors hover:border-accent hover:bg-accent/10"
            >
              <ShoppingCart className="h-3.5 w-3.5" />
              {quantityInCart > 0 ? "Add Another" : "Add to Cart"}
            </button>
          </div>
        </div>
      </article>
    </aside>
  );
}

function getProductColor(product: StoreProduct): string | null {
  const colorVariant = product.variants?.find((variant) =>
    /colou?r/i.test(variant.label),
  );
  const selectedColor =
    colorVariant?.options.find((option) => option.selected)?.label ??
    colorVariant?.options[0]?.label;

  if (selectedColor) return selectedColor;

  for (const section of product.specifications ?? []) {
    const colorSpec = section.specs.find((spec) => /colou?r/i.test(spec.label));
    if (colorSpec?.value) return colorSpec.value;
  }

  return null;
}

function getColorSwatch(color: string | null): string {
  const normalized = color?.toLowerCase() ?? "";

  if (normalized.includes("black")) return "#111827";
  if (normalized.includes("white")) return "#f8fafc";
  if (normalized.includes("silver") || normalized.includes("steel")) {
    return "#cbd5e1";
  }
  if (normalized.includes("grey") || normalized.includes("gray")) {
    return "#9ca3af";
  }
  if (normalized.includes("blue")) return "#2563eb";
  if (normalized.includes("red") || normalized.includes("wine")) {
    return "#991b1b";
  }
  if (normalized.includes("maroon")) return "#7f1d1d";

  return "#e5e7eb";
}

function getProductImages(product: StoreProduct): ProductImage[] {
  if (product.galleryImages && product.galleryImages.length > 0) {
    return product.galleryImages;
  }

  return [
    {
      id: `${product.slug}-main`,
      src: product.image,
      alt: product.name,
    },
  ];
}
