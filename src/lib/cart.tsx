"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Product } from "@/lib/products";
import { useCatalog } from "@/lib/catalog/CatalogProvider";

export type CartItem = {
  slug: string;
  size?: string;
  colour?: string;
  qty: number;
  giftNote?: string;
};

type CartContextValue = {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (slug: string, size?: string) => void;
  updateQty: (slug: string, qty: number, size?: string) => void;
  clear: () => void;
  count: number;
  subtotal: number;
  resolved: { product: Product; item: CartItem }[];
  wishlist: string[];
  toggleWishlist: (slug: string) => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const CART_KEY = "elijays-bag";
const WISH_KEY = "elijays-wishlist";

export function CartProvider({ children }: { children: ReactNode }) {
  const { getProduct } = useCatalog();
  const [items, setItems] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CART_KEY);
      const wish = localStorage.getItem(WISH_KEY);
      if (raw) setItems(JSON.parse(raw));
      if (wish) setWishlist(JSON.parse(wish));
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  }, [items, ready]);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(WISH_KEY, JSON.stringify(wishlist));
  }, [wishlist, ready]);

  const addItem = useCallback((item: CartItem) => {
    setItems((prev) => {
      const idx = prev.findIndex(
        (p) => p.slug === item.slug && p.size === item.size
      );
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: next[idx].qty + item.qty };
        return next;
      }
      return [...prev, item];
    });
  }, []);

  const removeItem = useCallback((slug: string, size?: string) => {
    setItems((prev) =>
      prev.filter((p) => !(p.slug === slug && p.size === size))
    );
  }, []);

  const updateQty = useCallback((slug: string, qty: number, size?: string) => {
    setItems((prev) =>
      prev
        .map((p) =>
          p.slug === slug && p.size === size ? { ...p, qty } : p
        )
        .filter((p) => p.qty > 0)
    );
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const toggleWishlist = useCallback((slug: string) => {
    setWishlist((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  }, []);

  const resolved = useMemo(
    () =>
      items
        .map((item) => {
          const product = getProduct(item.slug);
          return product ? { product, item } : null;
        })
        .filter(Boolean) as { product: Product; item: CartItem }[],
    [items, getProduct]
  );

  const count = items.reduce((n, i) => n + i.qty, 0);
  const subtotal = resolved.reduce(
    (n, { product, item }) => n + product.price * item.qty,
    0
  );

  const value = useMemo(
    () => ({
      items,
      addItem,
      removeItem,
      updateQty,
      clear,
      count,
      subtotal,
      resolved,
      wishlist,
      toggleWishlist,
    }),
    [
      items,
      addItem,
      removeItem,
      updateQty,
      clear,
      count,
      subtotal,
      resolved,
      wishlist,
      toggleWishlist,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
