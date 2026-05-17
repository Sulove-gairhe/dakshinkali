import Image from "next/image";
import { ShoppingCart } from "lucide-react";
import Link from "next/link";

interface ProductCardProps {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  image: string;
  currentPrice: string;
  oldPrice?: string;
  badge?: string;
  badges?: string[];
  href: string;
  onAddToCart?: (e: React.MouseEvent) => void;
}

export function ProductCard({
  name,
  shortDescription,
  image,
  currentPrice,
  oldPrice,
  badge,
  badges,
  href,
  onAddToCart,
}: ProductCardProps) {
  const badgeItems = badges ?? (badge ? [badge] : []);

  return (
    <Link href={href}>
      <div className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 cursor-pointer">
        {/* Badge */}
        {badgeItems.length > 0 && (
          <div className="absolute left-4 top-4 z-10 flex max-w-[calc(100%-5rem)] flex-wrap gap-2">
            {badgeItems.map((badgeItem) => (
              <span
                key={badgeItem}
                className="inline-block rounded-md bg-primary px-3 py-1 text-xs font-bold text-primary-foreground"
              >
                {badgeItem}
              </span>
            ))}
          </div>
        )}

        {/* Product Image */}
        <div className="relative h-64 w-full overflow-hidden bg-muted">
          <Image
            src={image}
            alt={name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>

        {/* Product Content */}
        <div className="flex flex-1 flex-col p-4">
          {/* Name */}
          <h3 className="line-clamp-2 text-base font-bold text-foreground">
            {name}
          </h3>

          {/* Short Description */}
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
            {shortDescription}
          </p>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Pricing */}
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-xl font-bold text-foreground">
              {currentPrice}
            </span>
            {oldPrice && (
              <span className="text-sm text-muted-foreground line-through">
                {oldPrice}
              </span>
            )}
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onAddToCart?.(e);
            }}
            className="mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-secondary px-4 py-3 text-sm font-semibold text-secondary-foreground transition-colors duration-300 hover:bg-secondary/90"
          >
            <ShoppingCart className="h-5 w-5" />
            Add to Cart
          </button>
        </div>
      </div>
    </Link>
  );
}
