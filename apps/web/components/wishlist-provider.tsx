"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { CartProduct } from "@/components/cart-provider";

const WISHLIST_STORAGE_KEY = "dakshinkali_wishlist";

type WishlistContextValue = {
  items: CartProduct[];
  itemCount: number;
  addItem: (product: CartProduct) => void;
  removeItem: (productId: string) => void;
  toggleItem: (product: CartProduct) => void;
  hasItem: (productId: string) => boolean;
};

const WishlistContext = createContext<WishlistContextValue | null>(null);

function readStoredWishlist() {
  if (typeof window === "undefined") return [];

  try {
    const storedWishlist = window.localStorage.getItem(WISHLIST_STORAGE_KEY);
    return storedWishlist ? (JSON.parse(storedWishlist) as CartProduct[]) : [];
  } catch {
    return [];
  }
}

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartProduct[]>([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setItems(readStoredWishlist());
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (!isReady) return;
    window.localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items));
  }, [isReady, items]);

  const addItem = useCallback((product: CartProduct) => {
    setItems((currentItems) => {
      if (currentItems.some((item) => item.id === product.id)) {
        return currentItems;
      }

      return [...currentItems, product];
    });
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((currentItems) =>
      currentItems.filter((item) => item.id !== productId),
    );
  }, []);

  const toggleItem = useCallback((product: CartProduct) => {
    setItems((currentItems) => {
      if (currentItems.some((item) => item.id === product.id)) {
        return currentItems.filter((item) => item.id !== product.id);
      }

      return [...currentItems, product];
    });
  }, []);

  const hasItem = useCallback(
    (productId: string) => items.some((item) => item.id === productId),
    [items],
  );

  const value = useMemo(
    () => ({
      items,
      itemCount: items.length,
      addItem,
      removeItem,
      toggleItem,
      hasItem,
    }),
    [addItem, hasItem, items, removeItem, toggleItem],
  );

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);

  if (!context) {
    throw new Error("useWishlist must be used within WishlistProvider");
  }

  return context;
}
