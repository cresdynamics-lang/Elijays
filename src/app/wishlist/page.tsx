"use client";

import Image from "next/image";
import Link from "next/link";
import { formatKes } from "@/lib/constants";
import { getProduct } from "@/lib/products";
import { useCart } from "@/lib/cart";

export default function WishlistPage() {
  const { wishlist, toggleWishlist } = useCart();
  const items = wishlist.map((s) => getProduct(s)).filter(Boolean);

  return (
    <div className="atmosphere min-h-screen pt-28 md:pt-36 pb-28">
      <div className="mx-auto max-w-[1600px] px-5 md:px-8 lg:px-12">
        <h1 className="display text-5xl">Wishlist</h1>
        {items.length === 0 ? (
          <p className="whisper text-xl mt-6">Nothing saved yet.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-10 mt-12">
            {items.map(
              (p) =>
                p && (
                  <div key={p.slug}>
                    <Link href={`/product/${p.slug}`} className="relative block aspect-[3/4] overflow-hidden">
                      <Image src={p.image} alt={p.name} fill className="object-cover" />
                    </Link>
                    <h2 className="display text-xl mt-4">{p.name}</h2>
                    <p className="text-gold text-sm mt-1">{formatKes(p.price)}</p>
                    <button
                      type="button"
                      onClick={() => toggleWishlist(p.slug)}
                      className="mt-3 text-[0.65rem] tracking-[0.15em] uppercase text-ivory/40 hover:text-gold"
                    >
                      Remove
                    </button>
                  </div>
                )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
