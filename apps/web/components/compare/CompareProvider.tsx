"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { StoreProduct } from "@/lib/store-products";
import { normalizeCategory, MAX_COMPARE_ITEMS } from "@/lib/compare-utils";

type CompareContextValue = {
  selectedProducts: StoreProduct[];
  lockedCategory: string | null;
  isCompareModalOpen: boolean;
  toggleProduct: (product: StoreProduct) => void;
  removeProduct: (productId: string) => void;
  clearAll: () => void;
  openModal: () => void;
  closeModal: () => void;
  isSelected: (productId: string) => boolean;
  canSelect: (product: StoreProduct) => { allowed: boolean; reason?: string };
};

const CompareContext = createContext<CompareContextValue | null>(null);

export function CompareProvider({ children }: { children: ReactNode }) {
  const [selectedProducts, setSelectedProducts] = useState<StoreProduct[]>([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

  const lockedCategory = useMemo(() => {
    if (selectedProducts.length === 0) return null;
    return normalizeCategory(selectedProducts[0].category);
  }, [selectedProducts]);

  const isSelected = useCallback(
    (productId: string) => selectedProducts.some((p) => p.id === productId),
    [selectedProducts],
  );

  const canSelect = useCallback(
    (product: StoreProduct): { allowed: boolean; reason?: string } => {
      if (isSelected(product.id)) return { allowed: true };

      if (selectedProducts.length >= MAX_COMPARE_ITEMS) {
        return { allowed: false, reason: `You can compare up to ${MAX_COMPARE_ITEMS} products` };
      }

      if (lockedCategory && normalizeCategory(product.category) !== lockedCategory) {
        return { allowed: false, reason: "You can only compare products from the same category" };
      }

      return { allowed: true };
    },
    [isSelected, lockedCategory, selectedProducts.length],
  );

  const toggleProduct = useCallback((product: StoreProduct) => {
    setSelectedProducts((current) => {
      const exists = current.some((p) => p.id === product.id);
      if (exists) return current.filter((p) => p.id !== product.id);
      if (current.length >= MAX_COMPARE_ITEMS) return current;
      if (current.length > 0 && normalizeCategory(product.category) !== normalizeCategory(current[0].category)) {
        return current;
      }
      return [...current, product];
    });
  }, []);

  const removeProduct = useCallback((productId: string) => {
    setSelectedProducts((current) => current.filter((p) => p.id !== productId));
  }, []);

  const clearAll = useCallback(() => {
    setSelectedProducts([]);
    setIsCompareModalOpen(false);
  }, []);

  const openModal = useCallback(() => {
    setIsCompareModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsCompareModalOpen(false);
  }, []);

  const value = useMemo(
    () => ({
      selectedProducts, lockedCategory, isCompareModalOpen,
      toggleProduct, removeProduct, clearAll,
      openModal, closeModal, isSelected, canSelect,
    }),
    [selectedProducts, lockedCategory, isCompareModalOpen, toggleProduct, removeProduct, clearAll, openModal, closeModal, isSelected, canSelect],
  );

  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>;
}

export function useCompare() {
  const context = useContext(CompareContext);
  if (!context) throw new Error("useCompare must be used within CompareProvider");
  return context;
}
