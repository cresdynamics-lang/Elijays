"use client";

import Image from "next/image";
import Link from "next/link";
import { formatKes } from "@/lib/constants";
import { useCatalog } from "@/lib/catalog/CatalogProvider";
import { useCart } from "@/lib/cart";

export default function WishlistPage() {
  const { wishlist, toggleWishlist } = useCart();
  const { getProduct } = useCatalog();
  const items = wishlist.map((s) => getProduct(s)).filter(Boolean);

  return (
    <div className="atmosphere min-h-screen pt-28 md:pt-36 pb-28">
      <div className="mx-auto max-w-[1600px] px-5 md:px-8 lg:px-12">
        <h1 className="display text-5xl">Wishlist</h1>
        {items.length === 0 ? (
          <p className="whisper text-xl mt-6">Nothing saved yet.</p>
        ) : (
          <div className="mt-12 grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-10 lg:grid-cols-3">
            {items.map(
              (p) =>
                p && (
                  <div key={p.slug}>
                    <Link href={`/product/${p.slug}`} className="relative block aspect-[3/4] overflow-hidden">
                      <Image src={p.image} alt={p.name} fill sizes="(max-width:640px) 50vw, 33vw" className="object-cover" />
                    </Link>
                    <h2 className="display mt-3 text-base sm:mt-4 sm:text-xl">{p.name}</h2>
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
