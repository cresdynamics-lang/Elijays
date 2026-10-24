"use client";

import { createContext, useContext, useMemo } from "react";
import { createCatalog, type Catalog, type Product } from "@/lib/products";

const CatalogContext = createContext<Catalog | null>(null);

/** Hands the server-loaded product list to client components (cart, search…). */
export function CatalogProvider({
  products,
  children,
}: {
  products: Product[];
  children: React.ReactNode;
}) {
  const catalog = useMemo(() => createCatalog(products), [products]);
  return (
    <CatalogContext.Provider value={catalog}>{children}</CatalogContext.Provider>
  );
}

export function useCatalog(): Catalog {
  const catalog = useContext(CatalogContext);
  if (!catalog) throw new Error("useCatalog must be used inside <CatalogProvider>");
  return catalog;
}
