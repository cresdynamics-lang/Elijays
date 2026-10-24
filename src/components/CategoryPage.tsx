"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ProductCard } from "@/components/ProductCard";
import { whatsappFittingUrl } from "@/lib/constants";
import type { Product } from "@/lib/products";

type Props = {
  title: string;
  subtitle: string;
  breadcrumb: string;
  products: Product[];
  chips: { label: string; value: string }[];
  bespokeCard?: boolean;
  filterLabels?: string[];
};

export function CategoryPage({
  title,
  subtitle,
  breadcrumb,
  products,
  chips,
  bespokeCard = false,
  filterLabels = ["Size", "Colour", "Price"],
}: Props) {
  const [active, setActive] = useState("all");
  const [sort, setSort] = useState("featured");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const filtered = useMemo(() => {
    let list =
      active === "all"
        ? products
        : products.filter((p) => p.subcategory === active);
    if (sort === "price-asc") list = [...list].sort((a, b) => a.price - b.price);
    if (sort === "price-desc") list = [...list].sort((a, b) => b.price - a.price);
    if (sort === "new") list = [...list].sort((a, b) => (b.updatedAt ? new Date(b.updatedAt).getTime() : 0) - (a.updatedAt ? new Date(a.updatedAt).getTime() : 0));
    return list;
  }, [products, active, sort]);

  return (
    <div className="atmosphere min-h-screen pt-28 md:pt-36 pb-28">
      <div className="mx-auto max-w-[1600px] px-5 md:px-8 lg:px-12">
        <p className="text-[0.65rem] tracking-[0.22em] uppercase text-ivory/40 mb-6">
          Home / {breadcrumb}
        </p>

        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-10">
          <div className="max-w-3xl">
            <h1 className="display text-5xl md:text-7xl text-ivory">{title}</h1>
            <p className="whisper text-xl md:text-2xl mt-5 max-w-xl">{subtitle}</p>
          </div>
          <label className="text-[0.65rem] tracking-[0.18em] uppercase text-ivory/50 flex items-center gap-3">
            Sort
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="bg-transparent border border-[var(--line)] text-gold px-3 py-2 outline-none"
            >
              <option value="featured">Featured</option>
              <option value="new">New</option>
              <option value="price-asc">Price ↑</option>
              <option value="price-desc">Price ↓</option>
            </select>
          </label>
        </div>

        <div className="flex gap-2 overflow-x-auto hide-scroll pb-2 mb-8">
          {chips.map((c) => (
            <button
              key={c.value}
              type="button"
              className={`chip shrink-0 ${active === c.value ? "active" : ""}`}
              onClick={() => setActive(c.value)}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="flex gap-10">
          <aside className="hidden xl:block w-44 shrink-0">
            <p className="eyebrow mb-4">Filter</p>
            <ul className="space-y-3 text-sm text-ivory/55">
              {filterLabels.map((f) => (
                <li key={f} className="border-b border-[var(--line)] pb-2">
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/size-guide"
              className="inline-block mt-8 text-[0.65rem] tracking-[0.18em] uppercase text-gold"
            >
              Size guide →
            </Link>
          </aside>

          <div className="flex-1">
            <button
              type="button"
              className="xl:hidden chip mb-6"
              onClick={() => setFiltersOpen(!filtersOpen)}
            >
              Filter
            </button>
            {filtersOpen && (
              <div className="xl:hidden flex flex-wrap gap-2 mb-6">
                {filterLabels.map((f) => (
                  <span key={f} className="chip">
                    {f}
                  </span>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-8 sm:gap-y-14 xl:grid-cols-3">
              {filtered.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
              {bespokeCard && (
                <a
                  href={whatsappFittingUrl()}
                  target="_blank"
                  rel="noreferrer"
                  className="relative aspect-[3/4] flex flex-col justify-end rounded-xl p-4 sm:min-h-[420px] sm:p-8 border border-[var(--line)] bg-gradient-to-br from-purple/20 via-noir-elevated to-noir overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(232,206,150,0.12),transparent_50%)]" />
                  <p className="eyebrow relative">Bespoke</p>
                  <h3 className="display text-xl sm:text-3xl md:text-4xl text-ivory mt-2 sm:mt-3 relative group-hover:text-gold transition-colors">
                    Not seeing it?
                  </h3>
                  <p className="whisper text-sm sm:text-lg mt-2 sm:mt-3 relative">Have it made for you.</p>
                  <span className="btn-gold mt-4 sm:mt-8 w-fit relative">Book a fitting</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
