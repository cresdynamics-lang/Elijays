"use client";

import Image from "next/image";
import Link from "next/link";
import { formatKes } from "@/lib/constants";
import { looks } from "@/lib/products";
import { useCatalog } from "@/lib/catalog/CatalogProvider";
import { useCart } from "@/lib/cart";

export default function LookbookPage() {
  const { addItem } = useCart();
  const { getProduct } = useCatalog();

  const addLook = (pieces: string[]) => {
    pieces.forEach((slug) => {
      const p = getProduct(slug);
      if (p) addItem({ slug, qty: 1, size: p.sizes?.[2] || p.sizes?.[0] });
    });
  };

  return (
    <div className="atmosphere min-h-screen pt-28 md:pt-36 pb-28">
      <div className="mx-auto max-w-[1600px] px-5 md:px-8 lg:px-12">
        <p className="eyebrow">Lookbook</p>
        <h1 className="display text-5xl md:text-7xl mt-4 max-w-3xl">
          Dress for the room you intend to own.
        </h1>
        <p className="whisper text-xl mt-6 max-w-xl">
          Six looks, each one buyable in a single tap.
        </p>

        <div className="mt-16 space-y-24 md:space-y-32">
          {looks.map((look, i) => {
            const pieces = look.pieces
              .map((s) => getProduct(s))
              .filter(Boolean);
            const total = pieces.reduce((n, p) => n + (p?.price || 0), 0);
            return (
              <article
                key={look.id}
                id={look.id}
                className={`grid lg:grid-cols-2 gap-10 lg:gap-16 items-center ${
                  i % 2 === 1 ? "lg:[&>*:first-child]:order-2" : ""
                }`}
              >
                <div className="relative aspect-[4/5] overflow-hidden">
                  <Image
                    src={look.image}
                    alt={look.title}
                    fill
                    sizes="50vw"
                    className="object-cover"
                  />
                </div>
                <div>
                  <p className="eyebrow">{look.occasion}</p>
                  <h2 className="display text-4xl md:text-5xl mt-3">{look.title}</h2>
                  <p className="mt-4 text-[0.7rem] tracking-[0.16em] uppercase text-gold/80">
                    {look.subtitle}
                  </p>
                  <ul className="mt-10 space-y-4">
                    {pieces.map((p) =>
                      p ? (
                        <li key={p.slug}>
                          <Link
                            href={`/product/${p.slug}`}
                            className="flex justify-between border-b border-[var(--line)] pb-3 hover:text-gold transition-colors"
                          >
                            <span>{p.name}</span>
                            <span className="text-ivory/40">{formatKes(p.price)}</span>
                          </Link>
                        </li>
                      ) : null
                    )}
                  </ul>
                  <div className="mt-10 flex flex-wrap items-center gap-6">
                    <button
                      type="button"
                      onClick={() => addLook(look.pieces)}
                      className="btn-gold"
                    >
                      Add the whole look
                    </button>
                    <p className="text-gold">{formatKes(total)}</p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
