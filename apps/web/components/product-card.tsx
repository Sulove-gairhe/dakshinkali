import Image from "next/image";
import { Heart, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  image: string;
  currentPrice: string;
  oldPrice?: string;
  badge?: string;
  href: string;
  onAddToCart?: (e: React.MouseEvent) => void;
  onToggleWishlist?: (e: React.MouseEvent) => void;
  quantityInCart?: number;
  isWishlisted?: boolean;
}

export function ProductCard({
  name,
  shortDescription,
  image,
  currentPrice,
  oldPrice,
  badge,
  href,
  onAddToCart,
  onToggleWishlist,
  quantityInCart = 0,
  isWishlisted = false,
}: ProductCardProps) {
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
        {/* Badge */}
        {badge && (
          <div className="absolute left-4 top-4 z-10">
            <span className="inline-block rounded-md bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">
              {badge}
            </span>
          </div>
        )}

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleWishlist?.(e);
          }}
          aria-label={isWishlisted ? `Remove ${name} from wishlist` : `Add ${name} to wishlist`}
          className={cn(
            "absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-foreground shadow-md ring-1 ring-border transition-colors hover:bg-white",
            isWishlisted && "text-red-600",
          )}
        >
          <Heart
            className={cn("h-5 w-5", isWishlisted && "fill-current")}
          />
        </button>

        {quantityInCart > 0 && (
          <div className="absolute right-4 top-16 z-10 flex h-8 min-w-8 items-center justify-center rounded-full bg-secondary px-2 text-sm font-bold text-secondary-foreground shadow-lg ring-2 ring-white">
            {quantityInCart}
          </div>
        )}

        {/* Product Image */}
        <Link
          href={href}
          className="relative block h-64 w-full overflow-hidden bg-muted"
        >
          <Image
            src={image}
            alt={name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </Link>

        {/* Product Content */}
        <div className="flex flex-1 flex-col p-4">
          {/* Name */}
          <Link
            href={href}
            className="line-clamp-2 text-base font-bold text-foreground transition-colors hover:text-primary"
          >
            {name}
          </Link>

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
            {quantityInCart > 0 ? "Add Another" : "Add to Cart"}
          </button>
        </div>
    </article>
  );
}
