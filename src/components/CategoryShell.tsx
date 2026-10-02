"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ProductCard } from "@/components/ProductCard";
import { track } from "@/lib/analytics";
import type { NavCategory } from "@/lib/navigation";
import { getNeighborCategories, getWhatsAppStylistUrl } from "@/lib/navigation";
import type { Product } from "@/lib/products";

type Chip = { label: string; value: string };

type Props = {
  category: NavCategory;
  products: Product[];
  chips: Chip[];
  activeChip?: string;
  filterLabels?: string[];
  bespokeCard?: boolean;
};

export function CategoryShell({
  category,
  products,
  chips,
  activeChip = "all",
  filterLabels = ["Size", "Colour", "Price"],
  bespokeCard = false,
}: Props) {
  const [active, setActive] = useState(activeChip);
  const [sort, setSort] = useState("featured");
  const neighbors = getNeighborCategories(category.id);
  const whatsappHref = getWhatsAppStylistUrl(category.label);

  const filtered = useMemo(() => {
    let list =
      active === "all"
        ? products
        : products.filter((p) => p.subcategory === active);
    if (sort === "price-asc") list = [...list].sort((a, b) => a.price - b.price);
    if (sort === "price-desc") list = [...list].sort((a, b) => b.price - a.price);
    if (sort === "new") {
      list = [...list].sort((a, b) => {
        const ta = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const tb = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return tb - ta;
      });
    }
    return list;
  }, [products, active, sort]);

  return (
    <div className="atmosphere min-h-screen pb-28 pt-8 md:pt-12">
      <div className="mx-auto max-w-[1600px] px-5 md:px-8 lg:px-12">
        <nav
          aria-label="Breadcrumb"
          className="mb-6 text-[0.65rem] uppercase tracking-[0.22em] text-ivory/40"
        >
          <Link href="/" className="hover:text-gold">
            Home
          </Link>
          <span className="mx-2">/</span>
          <span className="text-ivory/70">{category.page.h1}</span>
        </nav>

        <div className="mb-10 flex flex-col gap-6 lg:mb-14 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <h1 className="display text-5xl text-ivory md:text-7xl">
              {category.page.h1}
            </h1>
            <p className="whisper mt-5 max-w-xl text-xl md:text-2xl">
              {category.page.subline}
            </p>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-ivory/60">
              {category.page.intro}
            </p>
          </div>
          <div className="flex flex-col items-start gap-3 lg:items-end">
            <Link
              href={category.page.sizeGuideHref}
              className="text-[0.65rem] uppercase tracking-[0.18em] text-gold"
            >
              Size chart
            </Link>
            <label className="flex items-center gap-3 text-[0.65rem] uppercase tracking-[0.18em] text-ivory/50">
              Sort
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="border border-[var(--line)] bg-transparent px-3 py-2 text-gold outline-none"
              >
                <option value="featured">Featured</option>
                <option value="new">New</option>
                <option value="price-asc">Price rising</option>
                <option value="price-desc">Price falling</option>
              </select>
            </label>
          </div>
        </div>

        <div className="mb-8 flex gap-2 overflow-x-auto hide-scroll pb-2">
          {chips.map((c) => (
            <button
              key={c.value + c.label}
              type="button"
              className={`chip shrink-0 ${active === c.value ? "active" : ""}`}
              onClick={() => setActive(c.value)}
            >
              {c.label}
            </button>
          ))}
        </div>

        {active !== "all" && (
          <div className="mb-6 flex flex-wrap gap-2">
            <span className="chip active">
              {chips.find((c) => c.value === active)?.label || active}
              <button
                type="button"
                className="ml-2 text-gold"
                aria-label="Clear filter"
                onClick={() => setActive("all")}
              >
                ×
              </button>
            </span>
          </div>
        )}

        <div className="mb-10 flex flex-wrap items-center justify-between gap-4 border border-[var(--line)] bg-noir-soft/40 px-5 py-4">
          <p className="text-sm text-ivory/65">
            Not seeing your size? Message a stylist.
          </p>
          <a
            href={whatsappHref}
            target="_blank"
            rel="noreferrer"
            className="btn-ghost px-4 py-2.5 text-[0.65rem]"
            onClick={() =>
              track({ name: "whatsapp_click", page: category.label })
            }
          >
            WhatsApp a stylist
          </a>
        </div>

        <div className="flex gap-10">
          <aside className="hidden w-44 shrink-0 xl:block">
            <p className="eyebrow mb-4">Filter</p>
            <ul className="space-y-3 text-sm text-ivory/55">
              {filterLabels.map((f) => (
                <li key={f} className="border-b border-[var(--line)] pb-2">
                  {f}
                </li>
              ))}
            </ul>
          </aside>

          <div className="flex-1">
            <div className="grid grid-cols-1 gap-x-8 gap-y-14 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
              {bespokeCard && (
                <Link
                  href="/bespoke"
                  className="group relative flex min-h-[420px] aspect-[3/4] flex-col justify-end overflow-hidden border border-[var(--line)] bg-gradient-to-br from-purple/20 via-noir-elevated to-noir p-8"
                >
                  <p className="eyebrow relative">Bespoke</p>
                  <h3 className="display relative mt-3 text-3xl text-ivory transition-colors group-hover:text-gold md:text-4xl">
                    Not seeing it?
                  </h3>
                  <p className="whisper relative mt-3 text-lg">
                    Have it made for you.
                  </p>
                  <span className="btn-gold relative mt-8 w-fit">
                    Book a fitting
                  </span>
                </Link>
              )}
            </div>
          </div>
        </div>

        <section className="mt-20 max-w-3xl border-t border-[var(--line)] pt-10">
          <h2 className="sr-only">About {category.page.h1}</h2>
          <p className="text-sm leading-relaxed text-ivory/50">
            {category.page.seo}
          </p>
        </section>

        <nav
          aria-label="Neighbouring categories"
          className="mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-[var(--line)] pt-8"
        >
          {neighbors.prev ? (
            <Link
              href={neighbors.prev.slug}
              className="text-[0.65rem] uppercase tracking-[0.18em] text-ivory/55 hover:text-gold"
            >
              ← {neighbors.prev.label}
            </Link>
          ) : (
            <span />
          )}
          {neighbors.next ? (
            <Link
              href={neighbors.next.slug}
              className="text-[0.65rem] uppercase tracking-[0.18em] text-ivory/55 hover:text-gold"
            >
              {neighbors.next.label} →
            </Link>
          ) : (
            <span />
          )}
        </nav>
      </div>
    </div>
  );
}
