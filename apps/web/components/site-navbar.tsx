"use client";

import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { useCart } from "@/components/cart-provider";
import { useWishlist } from "@/components/wishlist-provider";
import { useCompare } from "@/contexts/compare-context";

export function SiteNavbar() {
  const router = useRouter();
  const { itemCount: cartCount, items: cartItems } = useCart();
  const { itemCount: wishlistCount } = useWishlist();
  const { count: compareCount } = useCompare();

  return (
    <Navbar
      cartCount={cartCount}
      wishlistCount={wishlistCount}
      compareCount={compareCount}
      cartPreviewItems={cartItems}
      accountHref="/account"
      cartHref="/cart"
      compareHref="/compare"
      wishlistHref="/wishlist"
      onSearch={(query) => {
        router.push(query ? `/products?q=${encodeURIComponent(query)}` : '/products');
      }}
    />
  );
}
