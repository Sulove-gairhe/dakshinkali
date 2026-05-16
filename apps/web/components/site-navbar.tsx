"use client";

import { Navbar } from "@/components/navbar";
import { useCart } from "@/components/cart-provider";
import { useWishlist } from "@/components/wishlist-provider";

export function SiteNavbar() {
  const { itemCount: cartCount, items: cartItems } = useCart();
  const { itemCount: wishlistCount } = useWishlist();

  return (
    <Navbar
      cartCount={cartCount}
      wishlistCount={wishlistCount}
      cartPreviewItems={cartItems}
      accountHref="/account"
      cartHref="/cart"
      compareHref="/compare"
      wishlistHref="/wishlist"
      onSearch={(query) => {
        console.log(query);
      }}
    />
  );
}
