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

/* ------------------------------------------------------------------ */
/*  Storage key scoped per user                                       */
/* ------------------------------------------------------------------ */

function getCartStorageKey(userId: string | null) {
  return userId
    ? `dakshinkali_cart:${userId}`
    : "dakshinkali_cart:anon";
}

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type CartProduct = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  image: string;
  currentPrice?: string | number;
  price?: string | number;
  salePrice?: string | number;
  discountPrice?: string | number;
  amount?: string | number;
  oldPrice?: string;
  href: string;
};

export type CartItem = CartProduct & {
  quantity: number;
  price: number;
  unitPrice: number;
};

type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  addItem: (product: CartProduct) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  getQuantity: (productId: string) => number;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

/* ------------------------------------------------------------------ */
/*  Price helpers                                                      */
/* ------------------------------------------------------------------ */

export function parseProductPrice(value: number | string | undefined | null) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (!value) return 0;

  const numericPrice = Number(value.match(/\d+(?:\.\d+)?/g)?.join("") ?? "");
  return Number.isFinite(numericPrice) ? numericPrice : 0;
}

function getProductPrice(product: CartProduct) {
  return parseProductPrice(
    product.price ??
      product.currentPrice ??
      product.salePrice ??
      product.discountPrice ??
      product.amount,
  );
}

function getDisplayedProductPrice(product: CartProduct) {
  return parseProductPrice(
    product.currentPrice ??
      product.salePrice ??
      product.discountPrice ??
      product.amount,
  );
}

function normalizeCartItem(item: CartItem): CartItem {
  const storedPrice = parseProductPrice(item.price);
  const productPrice = getDisplayedProductPrice(item);
  const storedUnitPrice = parseProductPrice(item.unitPrice);
  const unitPrice =
    (storedPrice > 1 ? storedPrice : 0) ||
    productPrice ||
    (storedUnitPrice > 1 ? storedUnitPrice : 0) ||
    storedPrice ||
    storedUnitPrice;
  const currentPrice =
    typeof item.currentPrice === "number"
      ? formatPrice(item.currentPrice)
      : item.currentPrice;

  return {
    ...item,
    currentPrice: currentPrice ?? formatPrice(unitPrice),
    quantity: Math.max(1, Number(item.quantity) || 1),
    price: unitPrice,
    unitPrice,
  };
}

function readStoredCart(key: string): CartItem[] {
  if (typeof window === "undefined") return [];

  try {
    const storedCart = window.localStorage.getItem(key);
    const parsedCart = storedCart ? (JSON.parse(storedCart) as CartItem[]) : [];
    return parsedCart.map(normalizeCartItem);
  } catch {
    return [];
  }
}

/* ------------------------------------------------------------------ */
/*  Provider                                                           */
/* ------------------------------------------------------------------ */

export interface CartProviderProps {
  children: React.ReactNode;
  /** Current authenticated user ID, or null for anonymous. */
  userId?: string | null;
}

export function CartProvider({ children, userId = null }: CartProviderProps) {
  const storageKey = getCartStorageKey(userId);
  const storageKeyRef = useRef(storageKey);

  const [items, setItems] = useState<CartItem[]>([]);
  const [isReady, setIsReady] = useState(false);

  // Load cart from the correct user-scoped key whenever userId changes.
  useEffect(() => {
    storageKeyRef.current = storageKey;
    const loaded = readStoredCart(storageKey);
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
      const existingItem = currentItems.find((item) => item.id === product.id);
      const unitPrice = getProductPrice(product);
      const currentPrice =
        typeof product.currentPrice === "number"
          ? formatPrice(product.currentPrice)
          : product.currentPrice;

      if (existingItem) {
        return currentItems.map((item) =>
          item.id === product.id
            ? {
                ...item,
                ...product,
                currentPrice: currentPrice ?? item.currentPrice,
                quantity: item.quantity + 1,
                price: unitPrice || item.unitPrice,
                unitPrice: unitPrice || item.unitPrice,
              }
            : item,
        );
      }

      return [
        ...currentItems,
        {
          ...product,
          currentPrice: currentPrice ?? formatPrice(unitPrice),
          quantity: 1,
          price: unitPrice,
          unitPrice,
        },
      ];
    });
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((currentItems) =>
      currentItems.filter((item) => item.id !== productId),
    );
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    setItems((currentItems) => {
      if (quantity <= 0) {
        return currentItems.filter((item) => item.id !== productId);
      }

      return currentItems.map((item) =>
        item.id === productId ? { ...item, quantity } : item,
      );
    });
  }, []);

  const getQuantity = useCallback(
    (productId: string) =>
      items.find((item) => item.id === productId)?.quantity ?? 0,
    [items],
  );

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const value = useMemo(
    () => ({
      items,
      itemCount: items.reduce((total, item) => total + item.quantity, 0),
      subtotal: items.reduce(
        (total, item) => total + item.unitPrice * item.quantity,
        0,
      ),
      addItem,
      removeItem,
      updateQuantity,
      getQuantity,
      clearCart,
    }),
    [addItem, clearCart, getQuantity, items, removeItem, updateQuantity],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }

  return context;
}

export function formatPrice(price: number) {
  return new Intl.NumberFormat("en-NP", {
    style: "currency",
    currency: "NPR",
    maximumFractionDigits: 0,
  }).format(price);
}
