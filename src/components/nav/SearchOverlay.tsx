"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCatalog } from "@/lib/catalog/CatalogProvider";

export function SearchOverlay({ onClose }: { onClose: () => void }) {
  const [q, setQ] = useState("");
  const { searchProducts } = useCatalog();
  const [results, setResults] = useState<
    { slug: string; name: string; subtitle: string }[]
  >([]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setResults(
      searchProducts(q)
        .slice(0, 8)
        .map((p) => ({
          slug: p.slug,
          name: p.name,
          subtitle: p.subtitle,
        }))
    );
  }, [q, searchProducts]);

  return (
    <div className="fixed inset-0 z-[70] flex flex-col items-center bg-noir/95 px-6 pt-28 backdrop-blur-md">
      <button
        type="button"
        onClick={onClose}
        className="absolute right-8 top-8 font-[family-name:var(--font-jost)] text-xs uppercase tracking-[0.2em] text-ivory/60 outline-none focus-visible:ring-2 focus-visible:ring-gold"
      >
        Close
      </button>
      <input
        autoFocus
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search suits, shirts, ties…"
        className="w-full max-w-2xl border-b border-[var(--line)] bg-transparent pb-4 font-[family-name:var(--font-playfair)] text-3xl text-ivory outline-none placeholder:text-ivory/30 md:text-5xl"
        aria-label="Search"
      />
      <ul className="mt-10 w-full max-w-2xl space-y-4">
        {results.map((r) => (
          <li key={r.slug}>
            <Link href={`/product/${r.slug}`} onClick={onClose} className="group block">
              <span className="font-[family-name:var(--font-playfair)] text-xl transition-colors group-hover:text-gold">
                {r.name}
              </span>
              <span className="mt-1 block text-xs uppercase tracking-[0.15em] text-ivory/50">
                {r.subtitle}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
