"use client";

import { Navbar } from "@/components/navbar";
import { useCart } from "@/components/cart-provider";
import { useWishlist } from "@/components/wishlist-provider";

type SiteNavbarProps = {
  showSecondaryNav?: boolean;
};

export function SiteNavbar({ showSecondaryNav }: SiteNavbarProps) {
  const { itemCount: cartCount, items: cartItems } = useCart();
  const { itemCount: wishlistCount } = useWishlist();

  return (
    <Navbar
      showSecondaryNav={showSecondaryNav}
      cartCount={cartCount}
      wishlistCount={wishlistCount}
      cartPreviewItems={cartItems}
      cartHref="/cart"
      wishlistHref="/wishlist"
    />
  );
}
