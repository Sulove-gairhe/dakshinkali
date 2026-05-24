"use client";

import { AuthProvider, useAuth } from "@dakshinkali/auth";
import { CartProvider } from "@/components/cart-provider";
import { WishlistProvider } from "@/components/wishlist-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AuthConsumerProviders>{children}</AuthConsumerProviders>
    </AuthProvider>
  );
}

/**
 * Inner wrapper that reads the authenticated user and passes the userId
 * into CartProvider / WishlistProvider so each user gets isolated state.
 */
function AuthConsumerProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  return (
    <CartProvider userId={userId}>
      <WishlistProvider userId={userId}>{children}</WishlistProvider>
    </CartProvider>
  );
}
