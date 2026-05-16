"use client";

import Link from "next/link";
import { useCart } from "@/components/cart-provider";
import { useWishlist } from "@/components/wishlist-provider";
import { ProductCard } from "./product-card";

interface Product {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  image: string;
  currentPrice: string;
  oldPrice?: string;
  badge?: string;
  href: string;
}

const mockProducts: Product[] = [
  {
    id: "1",
    slug: "samsung-253l-double-door-refrigerator",
    name: "Samsung 253L Double Door Frost Free Refrigerator RT28A3022GS/IM",
    shortDescription: "Digital Inverter | Energy Efficient | 10 Year Warranty",
    image: "/images/Samsung Double door 245 Litres.png",
    currentPrice: "Rs 51,999",
    oldPrice: "Rs 56,000",
    badge: "Rs 4,001 Off",
    href: "/products/samsung-253l-double-door",
  },
  {
    id: "2",
    slug: "samsung-192l-single-door-refrigerator",
    name: "Samsung 192L Single Door Refrigerator RR20M282ZS8",
    shortDescription:
      "Digital Inverter | Fast Direct Cooling | Stabilizer Free",
    image: "/images/Samsung 192Litre Single door refrigerator.jpeg",
    currentPrice: "Rs 32,980",
    oldPrice: "Rs 36,500",
    badge: "New Arrival / Rs 3,520 Off",
    href: "/products/samsung-192l-single-door",
  },
  {
    id: "3",
    slug: "himstar-chest-freezer-170",
    name: "Himstar Chest Freezer 170 Ltr HC-17H55SWG/WB",
    shortDescription: "High Capacity | Energy Efficient | Reliable Cooling",
    image: "/images/himstal 165 Litre deepfreezer.png",
    currentPrice: "Rs 37,900",
    oldPrice: "Rs 41,200",
    badge: "Rs 3,300 Off",
    href: "/products/himstar-chest-freezer-170",
  },
  {
    id: "4",
    slug: "samsung-65-crystal-uhd-tv",
    name: "Samsung 65 inch Crystal UHD 4K Smart TV UA65U8500F",
    shortDescription: "Metal Stream Design | 4K Resolution | Smart Features",
    image: "/images/Samsung 65 inch tv.png",
    currentPrice: "Rs 1,29,000",
    oldPrice: "Rs 1,35,000",
    badge: "New Arrival / Rs 6,000 Off",
    href: "/products/samsung-65-crystal-uhd-tv",
  },
];

export function TrendingProducts() {
  const { addItem, getQuantity } = useCart();
  const { hasItem, toggleItem } = useWishlist();

  const handleAddToCart = (product: Product) => {
    addItem(product);
  };

  return (
    <section className="bg-background py-12 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10 flex items-center justify-between">
          <h2 className="text-center text-2xl font-bold tracking-wide text-foreground sm:text-left sm:text-3xl">
            TRENDING PRODUCTS
          </h2>
          <Link
            href="/products"
            className="hidden text-sm font-semibold text-foreground transition-colors duration-300 hover:text-foreground/70 sm:block"
          >
            View all
          </Link>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {mockProducts.map((product) => (
            <ProductCard
              key={product.id}
              {...product}
              quantityInCart={getQuantity(product.id)}
              isWishlisted={hasItem(product.id)}
              onAddToCart={() => handleAddToCart(product)}
              onToggleWishlist={() => toggleItem(product)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
