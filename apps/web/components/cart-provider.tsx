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
import { useAuth } from "@dakshinkali/auth";
import { createApiClient } from "@/lib/api-client";

const CART_STORAGE_KEY = "dakshinkali_cart";
const CART_SESSION_KEY = "dakshinkali_cart_session";

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
  cartItemId?: string;
  quantity: number;
  unitPrice: number;
  currentUnitPrice?: number;
  isAvailable?: boolean;
  priceChanged?: boolean;
};

type ApiCartItem = {
  id: string;
  productId: string;
  productName: string;
  productSlug: string | null;
  productDescription: string | null;
  productCategory: string;
  productImage: string | null;
  productStatus: string;
  quantity: number;
  priceAtAddition: number;
  currentPrice: number;
  subtotal: number;
  isAvailable: boolean;
  priceChanged: boolean;
};

type ApiCart = {
  id: string | null;
  userId: string | null;
  items: ApiCartItem[];
  subtotal: number;
  total: number;
  itemCount: number;
  createdAt: string | null;
  updatedAt: string | null;
};

type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  loading: boolean;
  syncing: boolean;
  error: string;
  sessionId: string;
  addItem: (product: CartProduct) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  getQuantity: (productId: string) => number;
  refreshCart: () => Promise<void>;
  clearCart: () => Promise<void>;
};

const CartContext = createContext<CartContextValue | null>(null);

function parsePrice(price: string) {
  const numericPrice = Number(price.replace(/[^\d.]/g, ""));
  return Number.isFinite(numericPrice) ? numericPrice : 0;
}

function readStoredCart(): CartItem[] {
  if (typeof window === "undefined") return [];

  try {
    const storedCart = window.localStorage.getItem(CART_STORAGE_KEY);
    return storedCart ? (JSON.parse(storedCart) as CartItem[]) : [];
  } catch {
    return [];
  }
}

function getCartSessionId() {
  if (typeof window === "undefined") return "server-cart-session";

  const existing = window.localStorage.getItem(CART_SESSION_KEY);
  if (existing) return existing;

  const generated =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `guest-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  window.localStorage.setItem(CART_SESSION_KEY, generated);
  return generated;
}

function formatNpr(value: number) {
  return `Rs ${value.toLocaleString("en-NP", { maximumFractionDigits: 0 })}`;
}

function mapApiCartItem(item: ApiCartItem): CartItem {
  const slug = item.productSlug ?? item.productId;
  const productImage = item.productImage || "/images/logo-placeholder.jpeg";

  return {
    id: item.productId,
    cartItemId: item.id,
    slug,
    name: item.productName,
    shortDescription:
      item.productDescription ||
      `${item.productCategory || "Product"} · ${item.productStatus}`,
    image: productImage,
    currentPrice: formatNpr(item.priceAtAddition),
    href: `/products/${slug}`,
    quantity: item.quantity,
    unitPrice: item.priceAtAddition,
    currentUnitPrice: item.currentPrice,
    isAvailable: item.isAvailable,
    priceChanged: item.priceChanged,
  };
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { session, loading: authLoading } = useAuth();
  const [sessionId] = useState(getCartSessionId);
  const [items, setItems] = useState<CartItem[]>([]);
  const [storageReady, setStorageReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState("");
  const mergedSessionRef = useRef<string | null>(null);

  const api = useMemo(
    () =>
      createApiClient({
        accessToken: session?.access_token ?? null,
        sessionId: session?.access_token ? null : sessionId,
      }),
    [session?.access_token, sessionId],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const storedItems = readStoredCart();
      if (storedItems.length > 0) {
        setItems(storedItems);
      }
      setStorageReady(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!storageReady) return;
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items, storageReady]);

  const applyApiCart = useCallback((cart: ApiCart) => {
    setItems((cart.items || []).map(mapApiCartItem));
  }, []);

  const refreshCart = useCallback(async () => {
    if (authLoading) return;

    setLoading(true);
    setError("");

    try {
      const cart = await api.request<ApiCart>("/api/v1/cart");
      applyApiCart(cart);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to sync cart.");
    } finally {
      setLoading(false);
    }
  }, [api, applyApiCart, authLoading]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refreshCart();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [refreshCart]);

  useEffect(() => {
    if (!session?.access_token || mergedSessionRef.current === session.access_token) {
      return;
    }

    mergedSessionRef.current = session.access_token;

    const merge = async () => {
      setSyncing(true);
      try {
        const authenticatedApi = createApiClient({
          accessToken: session.access_token,
        });
        const cart = await authenticatedApi.request<ApiCart>("/api/v1/cart/merge", {
          method: "POST",
          body: JSON.stringify({ sessionId }),
        });
        applyApiCart(cart);
      } catch {
        await refreshCart();
      } finally {
        setSyncing(false);
      }
    };

    void merge();
  }, [applyApiCart, refreshCart, session?.access_token, sessionId]);

  const addItem = useCallback(
    async (product: CartProduct) => {
      setError("");
      setSyncing(true);

      setItems((currentItems) => {
        const existingItem = currentItems.find((item) => item.id === product.id);

        if (existingItem) {
          return currentItems.map((item) =>
            item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item,
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

      try {
        const cart = await api.request<ApiCart>("/api/v1/cart/items", {
          method: "POST",
          body: JSON.stringify({ productId: product.id, quantity: 1 }),
        });
        applyApiCart(cart);
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : "Unable to add item.");
      } finally {
        setSyncing(false);
      }
    },
    [api, applyApiCart],
  );

  const removeItem = useCallback(
    async (productId: string) => {
      const item = items.find((currentItem) => currentItem.id === productId);
      setItems((currentItems) => currentItems.filter((currentItem) => currentItem.id !== productId));

      if (!item?.cartItemId) return;

      setSyncing(true);
      try {
        const cart = await api.request<ApiCart>(`/api/v1/cart/items/${item.cartItemId}`, {
          method: "DELETE",
        });
        applyApiCart(cart);
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : "Unable to remove item.");
        await refreshCart();
      } finally {
        setSyncing(false);
      }
    },
    [api, applyApiCart, items, refreshCart],
  );

  const updateQuantity = useCallback(
    async (productId: string, quantity: number) => {
      const item = items.find((currentItem) => currentItem.id === productId);

      setItems((currentItems) => {
        if (quantity <= 0) {
          return currentItems.filter((currentItem) => currentItem.id !== productId);
        }

        return currentItems.map((currentItem) =>
          currentItem.id === productId ? { ...currentItem, quantity } : currentItem,
        );
      });

      if (!item?.cartItemId) return;

      setSyncing(true);
      try {
        const cart = await api.request<ApiCart>(`/api/v1/cart/items/${item.cartItemId}`, {
          method: "PUT",
          body: JSON.stringify({ quantity: Math.max(0, quantity) }),
        });
        applyApiCart(cart);
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : "Unable to update quantity.");
        await refreshCart();
      } finally {
        setSyncing(false);
      }
    },
    [api, applyApiCart, items, refreshCart],
  );

  const clearCart = useCallback(async () => {
    setItems([]);
    setSyncing(true);

    try {
      await api.request<void>("/api/v1/cart", { method: "DELETE" });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to clear cart.");
    } finally {
      setSyncing(false);
    }
  }, [api]);

  const getQuantity = useCallback(
    (productId: string) => items.find((item) => item.id === productId)?.quantity ?? 0,
    [items],
  );

  const value = useMemo(
    () => ({
      items,
      itemCount: items.reduce((total, item) => total + item.quantity, 0),
      subtotal: items.reduce((total, item) => total + item.unitPrice * item.quantity, 0),
      loading,
      syncing,
      error,
      sessionId,
      addItem,
      removeItem,
      updateQuantity,
      getQuantity,
      refreshCart,
      clearCart,
    }),
    [
      addItem,
      clearCart,
      error,
      getQuantity,
      items,
      loading,
      refreshCart,
      removeItem,
      sessionId,
      syncing,
      updateQuantity,
    ],
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
