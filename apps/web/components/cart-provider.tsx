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
  category?: string;
  categoryId?: string | null;
};

export type CartItem = CartProduct & {
  quantity: number;
  price: number;
  unitPrice: number;
};

export type CartMutationResult =
  | { ok: true }
  | { ok: false; message: string; issues?: unknown[] };

export type AppliedCoupon = {
  code: string;
  discountAmount: number;
  originalAmount: number;
  finalAmount: number;
  message: string;
};

type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  appliedCoupon: AppliedCoupon | null;
  discountedSubtotal: number;
  addItem: (product: CartProduct) => Promise<CartMutationResult>;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => Promise<CartMutationResult>;
  getQuantity: (productId: string) => number;
  clearCart: () => void;
  applyCoupon: (code: string) => Promise<AppliedCoupon>;
  clearCoupon: () => void;
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
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
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

  async function validateCartItems(
    itemsToValidate: Array<{ productId: string; quantity: number }>,
  ): Promise<CartMutationResult> {
    try {
      const response = await fetch("/api/cart/stock-validation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: itemsToValidate }),
      });

      const result = await response.json();

      if (!response.ok || result.valid === false) {
        const firstIssue = result.issues?.[0];
        return {
          ok: false,
          message:
            firstIssue?.message || "This item cannot be added to the cart.",
          issues: result.issues,
        };
      }

      return { ok: true };
    } catch {
      return {
        ok: false,
        message: "Unable to verify stock right now. Please try again.",
      };
    }
  }

  const addItem = useCallback(
    async (product: CartProduct): Promise<CartMutationResult> => {
      const currentItems = items;
      const existingItem = currentItems.find(
        (item) => item.id === product.id,
      );
      const currentQuantity = existingItem?.quantity ?? 0;
      const requestedQuantity = currentQuantity + 1;

      const validation = await validateCartItems([
        { productId: product.id, quantity: requestedQuantity },
      ]);

      if (!validation.ok) {
        return validation;
      }

      setAppliedCoupon(null);
      setItems((prevItems) => {
        const found = prevItems.find((item) => item.id === product.id);
        const unitPrice = getProductPrice(product);
        const currentPrice =
          typeof product.currentPrice === "number"
            ? formatPrice(product.currentPrice)
            : product.currentPrice;

        if (found) {
          return prevItems.map((item) =>
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
          ...prevItems,
          {
            ...product,
            currentPrice: currentPrice ?? formatPrice(unitPrice),
            quantity: 1,
            price: unitPrice,
            unitPrice,
          },
        ];
      });

      return { ok: true };
    },
    [items],
  );

  const removeItem = useCallback((productId: string) => {
    setItems((currentItems) =>
      currentItems.filter((item) => item.id !== productId),
    );
    setAppliedCoupon(null);
  }, []);

  const updateQuantity = useCallback(
    async (
      productId: string,
      quantity: number,
    ): Promise<CartMutationResult> => {
      if (quantity <= 0) {
        setItems((currentItems) =>
          currentItems.filter((item) => item.id !== productId),
        );
        setAppliedCoupon(null);
        return { ok: true };
      }

      const validation = await validateCartItems([
        { productId, quantity },
      ]);

      if (!validation.ok) {
        return validation;
      }

      setAppliedCoupon(null);
      setItems((currentItems) =>
        currentItems.map((item) =>
          item.id === productId ? { ...item, quantity } : item,
        ),
      );

      return { ok: true };
    },
    [],
  );

  const getQuantity = useCallback(
    (productId: string) =>
      items.find((item) => item.id === productId)?.quantity ?? 0,
    [items],
  );

  const clearCart = useCallback(() => {
    setItems([]);
    setAppliedCoupon(null);
  }, []);

  const applyCoupon = useCallback(
    async (code: string) => {
      const response = await fetch("/api/coupons/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          items: items.map((item) => ({
            productId: item.id,
            productSlug: item.slug,
            productName: item.name,
            categoryId: item.categoryId ?? null,
            categoryName: item.category ?? null,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          })),
        }),
      });

      const result = await response.json();
      if (!response.ok || !result.valid) {
        throw new Error(result.message || "Unable to apply coupon.");
      }

      const coupon: AppliedCoupon = {
        code: result.code,
        discountAmount: Number(result.discountAmount) || 0,
        originalAmount: Number(result.originalAmount) || 0,
        finalAmount: Number(result.finalAmount) || 0,
        message: result.message,
      };
      setAppliedCoupon(coupon);
      return coupon;
    },
    [items],
  );

  const clearCoupon = useCallback(() => {
    setAppliedCoupon(null);
  }, []);

  const value = useMemo(
    () => ({
      items,
      itemCount: items.reduce((total, item) => total + item.quantity, 0),
      subtotal: items.reduce(
        (total, item) => total + item.unitPrice * item.quantity,
        0,
      ),
      appliedCoupon,
      discountedSubtotal: appliedCoupon
        ? Math.max(
            0,
            items.reduce(
              (total, item) => total + item.unitPrice * item.quantity,
              0,
            ) - appliedCoupon.discountAmount,
          )
        : items.reduce(
            (total, item) => total + item.unitPrice * item.quantity,
            0,
          ),
      addItem,
      removeItem,
      updateQuantity,
      getQuantity,
      clearCart,
      applyCoupon,
      clearCoupon,
    }),
    [
      addItem,
      appliedCoupon,
      applyCoupon,
      clearCart,
      clearCoupon,
      getQuantity,
      items,
      removeItem,
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
