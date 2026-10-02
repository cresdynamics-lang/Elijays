"use client";

import Image from "next/image";
import Link from "next/link";
import { formatKes } from "@/lib/constants";
import type { Product } from "@/lib/products";
import { getProductTags, tagLabel } from "@/lib/productTags";
import { useCart } from "@/lib/cart";

export function ProductCard({ product }: { product: Product }) {
  const { toggleWishlist, wishlist } = useCart();
  const wished = wishlist.includes(product.slug);
  const tags = getProductTags(product);

  return (
    <article className="group relative">
      <Link href={`/product/${product.slug}`} className="block">
        <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-noir-elevated">
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width:768px) 90vw, (max-width:1200px) 45vw, 28vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-noir/50 via-transparent to-transparent opacity-80" />
          {tags.length > 0 && (
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className={`rounded-md px-2.5 py-1 text-[0.6rem] uppercase tracking-[0.18em] ${
                    tag === "new"
                      ? "bg-gold/90 text-noir"
                      : tag === "bespoke"
                        ? "bg-purple/50 text-ivory"
                        : "bg-noir/75 text-gold"
                  }`}
                >
                  {tagLabel(tag)}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="pt-5 pb-2">
          <h3 className="display text-xl text-ivory transition-colors group-hover:text-gold md:text-2xl">
            {product.name}
          </h3>
          <p className="mt-1.5 text-[0.65rem] uppercase tracking-[0.18em] text-ivory/45">
            {product.subtitle}
          </p>
          <p className="mt-3 text-sm text-gold">{formatKes(product.price)}</p>
        </div>
      </Link>
      <button
        type="button"
        onClick={() => toggleWishlist(product.slug)}
        className="absolute top-4 right-4 rounded-md bg-noir/50 px-2 py-1 text-[0.6rem] uppercase tracking-[0.15em] text-ivory/70 hover:text-gold"
        aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
      >
        {wished ? "Saved" : "Save"}
      </button>
    </article>
  );
}
