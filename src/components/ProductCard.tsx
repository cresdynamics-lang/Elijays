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
            sizes="(max-width:640px) 50vw, (max-width:1200px) 45vw, 28vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-noir/50 via-transparent to-transparent opacity-80" />
          {tags.length > 0 && (
            <div className="absolute left-2 top-2 flex flex-col gap-1.5 sm:left-4 sm:top-4 sm:gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className={`rounded-md px-1.5 py-0.5 text-[0.5rem] uppercase tracking-[0.14em] sm:px-2.5 sm:py-1 sm:text-[0.6rem] sm:tracking-[0.18em] ${
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
        <div className="pb-2 pt-3 sm:pt-5">
          <h3 className="display text-base leading-snug text-ivory transition-colors group-hover:text-gold sm:text-xl md:text-2xl">
            {product.name}
          </h3>
          <p className="mt-1 line-clamp-2 text-[0.55rem] uppercase tracking-[0.14em] text-ivory/45 sm:mt-1.5 sm:text-[0.65rem] sm:tracking-[0.18em]">
            {product.subtitle}
          </p>
          <p className="mt-2 text-sm text-gold sm:mt-3">{formatKes(product.price)}</p>
        </div>
      </Link>
      <button
        type="button"
        onClick={() => toggleWishlist(product.slug)}
        className="absolute right-2 top-2 rounded-md bg-noir/50 px-1.5 py-0.5 text-[0.5rem] uppercase tracking-[0.12em] text-ivory/70 hover:text-gold sm:right-4 sm:top-4 sm:px-2 sm:py-1 sm:text-[0.6rem] sm:tracking-[0.15em]"
        aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
      >
        {wished ? "Saved" : "Save"}
      </button>
    </article>
  );
}
