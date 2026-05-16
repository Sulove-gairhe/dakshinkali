"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const CART_STORAGE_KEY = "dakshinkali_cart";

export type CartProduct = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  image: string;
  currentPrice: string;
  oldPrice?: string;
  href: string;
};

export type CartItem = CartProduct & {
  quantity: number;
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
};

const CartContext = createContext<CartContextValue | null>(null);

function parsePrice(price: string) {
  const numericPrice = Number(price.replace(/[^\d.]/g, ""));
  return Number.isFinite(numericPrice) ? numericPrice : 0;
}

function readStoredCart() {
  if (typeof window === "undefined") return [];

  try {
    const storedCart = window.localStorage.getItem(CART_STORAGE_KEY);
    return storedCart ? (JSON.parse(storedCart) as CartItem[]) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setItems(readStoredCart());
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (!isReady) return;
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [isReady, items]);

  const addItem = useCallback((product: CartProduct) => {
    setItems((currentItems) => {
      const existingItem = currentItems.find((item) => item.id === product.id);

      if (existingItem) {
        return currentItems.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }

      return [
        ...currentItems,
        {
          ...product,
          quantity: 1,
          unitPrice: parsePrice(product.currentPrice),
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
    }),
    [addItem, getQuantity, items, removeItem, updateQuantity],
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
