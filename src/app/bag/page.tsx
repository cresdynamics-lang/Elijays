"use client";

import Image from "next/image";
import Link from "next/link";
import { BRAND, formatKes, whatsappOrderUrl } from "@/lib/constants";
import { useCart } from "@/lib/cart";

export default function BagPage() {
  const { resolved, updateQty, removeItem, subtotal, count } = useCart();

  const waBag = () => {
    const lines = resolved.map(
      ({ product, item }) =>
        `• ${product.name}${item.size ? ` (${item.size})` : ""} × ${item.qty} — ${formatKes(product.price * item.qty)}`
    );
    return `Hello ELIJAYS — my bag:\n${lines.join("\n")}\n\nSubtotal: ${formatKes(subtotal)}`;
  };

  if (count === 0) {
    return (
      <div className="atmosphere min-h-screen pt-36 pb-28 px-5 text-center">
        <h1 className="display text-5xl">Your cart is empty</h1>
        <p className="whisper text-xl mt-4">The wardrobe is waiting.</p>
        <Link href="/suits" className="btn-gold mt-10 inline-flex">
          Shop the collection
        </Link>
      </div>
    );
  }

  return (
    <div className="atmosphere min-h-screen pt-28 md:pt-36 pb-28">
      <div className="mx-auto max-w-[1100px] px-5 md:px-8">
        <h1 className="display text-5xl md:text-6xl">Your Cart</h1>
        <p className="mt-3 text-ivory/50 text-sm tracking-[0.15em] uppercase">
          {count} {count === 1 ? "piece" : "pieces"}
        </p>

        <div className="mt-12 space-y-8">
          {resolved.map(({ product, item }) => (
            <div
              key={`${product.slug}-${item.size}`}
              className="grid grid-cols-[100px_1fr] md:grid-cols-[140px_1fr_auto] gap-5 md:gap-8 border-b border-[var(--line)] pb-8"
            >
              <Link href={`/product/${product.slug}`} className="relative aspect-[3/4] overflow-hidden">
                <Image src={product.image} alt={product.name} fill className="object-cover" />
              </Link>
              <div>
                <Link href={`/product/${product.slug}`} className="display text-xl md:text-2xl hover:text-gold">
                  {product.name}
                </Link>
                <p className="mt-2 text-sm text-ivory/50">
                  {item.size && <>Size {item.size} · </>}
                  Free alteration
                </p>
                <div className="flex items-center gap-4 mt-4">
                  <button
                    type="button"
                    className="w-8 h-8 border border-[var(--line)] text-ivory/70"
                    onClick={() => updateQty(product.slug, item.qty - 1, item.size)}
                  >
                    −
                  </button>
                  <span>{item.qty}</span>
                  <button
                    type="button"
                    className="w-8 h-8 border border-[var(--line)] text-ivory/70"
                    onClick={() => updateQty(product.slug, item.qty + 1, item.size)}
                  >
                    +
                  </button>
                  <button
                    type="button"
                    onClick={() => removeItem(product.slug, item.size)}
                    className="ml-4 text-[0.65rem] tracking-[0.15em] uppercase text-ivory/40 hover:text-gold"
                  >
                    Remove
                  </button>
                </div>
              </div>
              <p className="text-gold md:text-right">
                {formatKes(product.price * item.qty)}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-12 border border-[var(--line)] p-8 md:p-10 bg-noir-soft/40 max-w-md ml-auto">
          <div className="flex justify-between text-sm text-ivory/60 mb-3">
            <span>Subtotal</span>
            <span>{formatKes(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm text-ivory/60 mb-3">
            <span>Delivery, Nairobi</span>
            <span className="text-gold">Free</span>
          </div>
          <div className="flex justify-between display text-2xl pt-4 border-t border-[var(--line)]">
            <span>Total</span>
            <span className="text-gold">{formatKes(subtotal)}</span>
          </div>
          <Link href="/checkout" className="btn-gold w-full mt-8">
            Checkout
          </Link>
          <a
            href={whatsappOrderUrl(waBag())}
            target="_blank"
            rel="noreferrer"
            className="btn-ghost w-full mt-3"
          >
            Send bag to stylist on WhatsApp
          </a>
          <p className="mt-4 text-center text-xs text-ivory/35">
            Or WhatsApp {BRAND.phone}
          </p>
        </div>
      </div>
    </div>
  );
}
