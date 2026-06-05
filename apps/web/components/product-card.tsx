import Image from "next/image";
import { Heart, ShieldCheck, ShoppingCart } from "lucide-react";
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
  warranty: string;
  badge?: string;
  badges?: string[];
  href: string;
  onAddToCart?: (e: React.MouseEvent) => void;
  onToggleWishlist?: (e: React.MouseEvent) => void;
  quantityInCart?: number;
  isWishlisted?: boolean;
  renderCompare?: React.ReactNode;
}

export function ProductCard({
  name,
  shortDescription,
  image,
  currentPrice,
  oldPrice,
  warranty,
  badge,
  badges,
  href,
  onAddToCart,
  onToggleWishlist,
  quantityInCart = 0,
  isWishlisted = false,
  renderCompare,
}: ProductCardProps) {
  const badgeItems = badges ?? (badge ? [badge] : []);

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
      {/* Badge */}
      {badgeItems.length > 0 && (
        <div className="absolute left-4 top-4 z-10 flex max-w-[calc(100%-5rem)] flex-wrap gap-2">
          {badgeItems.map((badgeItem) => (
            <span
              key={badgeItem}
              className="inline-block rounded-md bg-accent/15 px-3 py-1 text-xs font-bold text-primary ring-1 ring-accent/30"
            >
              {badgeItem}
            </span>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onToggleWishlist?.(e);
        }}
        aria-label={
          isWishlisted
            ? `Remove ${name} from wishlist`
            : `Add ${name} to wishlist`
        }
        className={cn(
          "absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-primary shadow-md ring-1 ring-border transition-colors hover:bg-white hover:text-primary/80",
          isWishlisted && "text-red-600",
        )}
      >
        <Heart className={cn("h-5 w-5", isWishlisted && "fill-current")} />
      </button>

      {quantityInCart > 0 && (
        <div className="absolute right-4 top-16 z-10 flex h-8 min-w-8 items-center justify-center rounded-full bg-primary px-2 text-sm font-bold text-primary-foreground shadow-lg ring-2 ring-white">
          {quantityInCart}
        </div>
      )}

      {/* Product Image */}
      <Link
        href={href}
        className="relative block aspect-square w-full overflow-hidden bg-white p-4"
      >
        <Image
          src={image}
          alt={name}
          fill
          sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-contain transition-transform duration-300 group-hover:scale-[1.03]"
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

        <div className="mt-3 flex items-start gap-1.5 border-t border-border/70 pt-3 text-xs font-medium text-muted-foreground">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
          <span className="line-clamp-1">
            <span className="font-semibold text-stone-700 dark:text-stone-200">
              Warranty:
            </span>{" "}
            {warranty}
          </span>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Pricing */}
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-xl font-bold text-gray-950">
            {currentPrice}
          </span>
          {oldPrice && (
            <span className="text-sm text-muted-foreground line-through">
              {oldPrice}
            </span>
          )}
        </div>

        {/* Compare Toggle */}
        {renderCompare && (
          <div className="mt-3">{renderCompare}</div>
        )}

        {/* Add to Cart Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onAddToCart?.(e);
          }}
          className="mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-accent/45 bg-white px-4 py-3 text-sm font-semibold text-primary shadow-sm transition-colors duration-300 hover:border-accent hover:bg-accent/10"
        >
          <ShoppingCart className="h-5 w-5" />
          {quantityInCart > 0 ? "Add Another" : "Add to Cart"}
        </button>
      </div>
    </article>
  );
}
