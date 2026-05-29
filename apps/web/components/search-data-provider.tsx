"use client";

import { createContext, useContext } from "react";
import type { StoreProduct } from "@/lib/store-products";
import type { DbCategory } from "@/lib/db-products";

type SearchData = {
  dbProducts: StoreProduct[];
  dbCategories: DbCategory[];
};

const SearchDataContext = createContext<SearchData>({
  dbProducts: [],
  dbCategories: [],
});

export function SearchDataProvider({
  dbProducts,
  dbCategories,
  children,
}: SearchData & { children: React.ReactNode }) {
  return (
    <SearchDataContext.Provider value={{ dbProducts, dbCategories }}>
      {children}
    </SearchDataContext.Provider>
  );
}

export function useSearchData(): SearchData {
  return useContext(SearchDataContext);
}
