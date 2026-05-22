'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { catalogProducts } from '@/data/catalog';

type CompareField = {
  label: string;
  value: string;
};

export interface CompareProduct {
  id: string;
  slug?: string;
  name: string;
  price: number;
  image: string;
  category: string;
  status: string;
  description?: string;
  compareFields?: CompareField[];
}

interface CompareContextType {
  products: CompareProduct[];
  addProduct: (product: CompareProduct) => void;
  removeProduct: (id: string) => void;
  clearProducts: () => void;
  isInCompare: (id: string) => boolean;
  count: number;
  maxProducts: number;
}

const STORAGE_KEY = 'dakshinkali-compare';
const MAX_PRODUCTS = 4;
const legacyProductSlugById = new Map(catalogProducts.map((product) => [product.id, product.slug]));

const CompareContext = createContext<CompareContextType | undefined>(undefined);

function readStoredCompareProducts(): CompareProduct[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];

    return parsed.map((product) => ({
      ...product,
      slug: product.slug ?? legacyProductSlugById.get(product.id) ?? product.id,
    }));
  } catch {
    return [];
  }
}

export function CompareProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<CompareProduct[]>([]);
  const [storageReady, setStorageReady] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const storedProducts = readStoredCompareProducts();
      if (storedProducts.length > 0) {
        setProducts(storedProducts);
      }
      setStorageReady(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!storageReady) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
    } catch {
      // Ignore storage errors
    }
  }, [products, storageReady]);

  const addProduct = useCallback((product: CompareProduct) => {
    const productKey = product.slug ?? product.id;
    setProducts((prev) => {
      if (prev.length >= MAX_PRODUCTS) return prev;
      if (prev.some((p) => (p.slug ?? p.id) === productKey || p.id === product.id)) return prev;
      return [...prev, { ...product, slug: productKey }];
    });
  }, []);

  const removeProduct = useCallback((id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const clearProducts = useCallback(() => {
    setProducts([]);
  }, []);

  const isInCompare = useCallback(
    (id: string) => products.some((p) => p.id === id || p.slug === id),
    [products]
  );

  const value = useMemo(
    () => ({
      products,
      addProduct,
      removeProduct,
      clearProducts,
      isInCompare,
      count: products.length,
      maxProducts: MAX_PRODUCTS,
    }),
    [addProduct, clearProducts, isInCompare, products, removeProduct],
  );

  return (
    <CompareContext.Provider value={value}>{children}</CompareContext.Provider>
  );
}

export function useCompare() {
  const context = useContext(CompareContext);
  if (!context) {
    throw new Error('useCompare must be used within a CompareProvider');
  }
  return context;
}
