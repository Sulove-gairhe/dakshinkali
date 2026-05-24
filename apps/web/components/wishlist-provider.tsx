"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { CartProduct } from "@/components/cart-provider";

/* ------------------------------------------------------------------ */
/*  Storage key scoped per user                                       */
/* ------------------------------------------------------------------ */

function getWishlistStorageKey(userId: string | null) {
  return userId
    ? `dakshinkali_wishlist:${userId}`
    : "dakshinkali_wishlist:anon";
}

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type WishlistContextValue = {
  items: CartProduct[];
  itemCount: number;
  addItem: (product: CartProduct) => void;
  removeItem: (productId: string) => void;
  toggleItem: (product: CartProduct) => void;
  hasItem: (productId: string) => boolean;
  clearWishlist: () => void;
};

const WishlistContext = createContext<WishlistContextValue | null>(null);

/* ------------------------------------------------------------------ */
/*  localStorage helpers                                               */
/* ------------------------------------------------------------------ */

function readStoredWishlist(key: string): CartProduct[] {
  if (typeof window === "undefined") return [];

  try {
    const storedWishlist = window.localStorage.getItem(key);
    return storedWishlist ? (JSON.parse(storedWishlist) as CartProduct[]) : [];
  } catch {
    return [];
  }
}

/* ------------------------------------------------------------------ */
/*  Provider                                                           */
/* ------------------------------------------------------------------ */

export interface WishlistProviderProps {
  children: React.ReactNode;
  /** Current authenticated user ID, or null for anonymous. */
  userId?: string | null;
}

export function WishlistProvider({
  children,
  userId = null,
}: WishlistProviderProps) {
  const storageKey = getWishlistStorageKey(userId);
  const storageKeyRef = useRef(storageKey);

  const [items, setItems] = useState<CartProduct[]>([]);
  const [isReady, setIsReady] = useState(false);

  // Load wishlist from the correct user-scoped key whenever userId changes.
  useEffect(() => {
    storageKeyRef.current = storageKey;
    const loaded = readStoredWishlist(storageKey);
    setItems(loaded);
    setIsReady(true);
  }, [storageKey]);

  // Persist items to the current user-scoped key.
  useEffect(() => {
    if (!isReady) return;
    window.localStorage.setItem(storageKeyRef.current, JSON.stringify(items));
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

  const clearWishlist = useCallback(() => {
    setItems([]);
  }, []);

  const value = useMemo(
    () => ({
      items,
      itemCount: items.length,
      addItem,
      removeItem,
      toggleItem,
      hasItem,
      clearWishlist,
    }),
    [addItem, clearWishlist, hasItem, items, removeItem, toggleItem],
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
