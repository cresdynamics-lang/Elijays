"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { BRAND, formatKes, whatsappOrderUrl } from "@/lib/constants";
import type { Product } from "@/lib/products";
import { useCatalog } from "@/lib/catalog/CatalogProvider";
import { getProductTags, tagLabel } from "@/lib/productTags";
import { useCart } from "@/lib/cart";
import { trackMeta } from "@/lib/analytics";
import { MetaViewContent } from "@/components/MetaEvents";

export function ProductDetail({ product }: { product: Product }) {
  const { addItem, toggleWishlist, wishlist } = useCart();
  const { getProduct } = useCatalog();
  const images = product.images?.length ? product.images : [product.image];
  const [activeImg, setActiveImg] = useState(0);
  const [size, setSize] = useState(product.sizes?.[2] || product.sizes?.[0] || "");
  const [colour, setColour] = useState(product.colours?.[0] || "");
  const [giftNote, setGiftNote] = useState("");
  const [added, setAdded] = useState(false);
  const [zoom, setZoom] = useState(false);

  const pairs = useMemo(
    () =>
      (product.pairsWith || [])
        .map((s) => getProduct(s))
        .filter(Boolean) as Product[],
    [product, getProduct]
  );

  const waMessage = `Hello ELIJAYS — I'd like to order:\n${product.name}${size ? ` · Size ${size}` : ""}${colour ? ` · ${colour}` : ""}\n${formatKes(product.price)}`;

  const onAdd = () => {
    addItem({
      slug: product.slug,
      size: size || undefined,
      colour: colour || undefined,
      qty: 1,
      giftNote: giftNote || undefined,
    });
    trackMeta({
      name: "AddToCart",
      content_ids: [product.slug],
      value: product.price,
      currency: "KES",
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="atmosphere min-h-screen pt-28 md:pt-32 pb-28">
      <MetaViewContent id={product.slug} value={product.price} />
      <div className="mx-auto max-w-[1600px] px-5 md:px-8 lg:px-12">
        <p className="text-[0.65rem] tracking-[0.2em] uppercase text-ivory/40 mb-8">
          {product.category} / {product.subcategory.replace(/-/g, " ")}
        </p>

        <div className="grid lg:grid-cols-12 gap-10 lg:gap-16">
          {/* Gallery */}
          <div className="lg:col-span-7">
            <button
              type="button"
              onClick={() => setZoom(true)}
              className="relative w-full aspect-[4/5] overflow-hidden bg-noir-elevated block"
            >
              <Image
                src={images[activeImg]}
                alt={product.name}
                fill
                priority
                sizes="(max-width:1024px) 100vw, 55vw"
                className="object-cover"
              />
              <span className="absolute bottom-4 right-4 text-[0.6rem] tracking-[0.18em] uppercase text-ivory/70 bg-noir/60 px-2 py-1">
                Zoom · fabric detail
              </span>
            </button>
            {images.length > 1 && (
              <div className="flex gap-3 mt-4">
                {images.map((img, i) => (
                  <button
                    key={img + i}
                    type="button"
                    onClick={() => setActiveImg(i)}
                    className={`relative w-20 h-24 overflow-hidden border ${
                      i === activeImg ? "border-gold" : "border-transparent"
                    }`}
                  >
                    <Image src={img} alt="" fill className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="lg:col-span-5 lg:pt-4">
            {(() => {
              const tags = getProductTags(product);
              return tags.length > 0 ? (
                <div className="mb-4 flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className={`rounded-md px-2.5 py-1 text-[0.6rem] uppercase tracking-[0.18em] ${
                        tag === "new"
                          ? "bg-gold/90 text-noir"
                          : tag === "bespoke"
                            ? "bg-purple/50 text-ivory"
                            : "border border-gold/40 text-gold"
                      }`}
                    >
                      {tagLabel(tag)}
                    </span>
                  ))}
                </div>
              ) : null;
            })()}
            <p className="eyebrow">
              {[product.fit, product.fabric].filter(Boolean).join(" · ") || BRAND.tagline}
            </p>
            <h1 className="display mt-4 text-4xl text-ivory md:text-5xl lg:text-6xl">
              {product.name}
            </h1>
            <p className="text-gold text-xl mt-5">{formatKes(product.price)}</p>
            <p className="mt-6 text-ivory/65 leading-relaxed text-base max-w-md">
              {product.description}
            </p>

            {product.colours && product.colours.length > 0 && (
              <div className="mt-10">
                <p className="text-[0.65rem] tracking-[0.2em] uppercase text-ivory/50 mb-3">
                  Colour
                </p>
                <div className="flex flex-wrap gap-2">
                  {product.colours.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColour(c)}
                      className={`chip ${colour === c ? "active" : ""}`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {product.sizes && (
              <div className="mt-8">
                <div className="flex justify-between mb-3">
                  <p className="text-[0.65rem] tracking-[0.2em] uppercase text-ivory/50">
                    Size
                  </p>
                  <Link href="/size-guide" className="text-[0.65rem] tracking-[0.15em] uppercase text-gold">
                    Size guide
                  </Link>
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSize(s)}
                      className={`min-w-12 h-12 rounded-lg border text-sm tracking-wider transition-colors ${
                        size === s
                          ? "border-gold text-gold bg-gold/10"
                          : "border-[var(--line)] text-ivory/70 hover:border-gold/50"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                {product.stockHint && (
                  <p className="mt-3 text-xs text-gold/80">{product.stockHint}</p>
                )}
              </div>
            )}

            {product.giftOptions && (
              <div className="mt-8 space-y-4 border border-[var(--line)] p-5">
                <p className="eyebrow">Gift options</p>
                <label className="flex items-center gap-3 text-sm text-ivory/70">
                  <input type="checkbox" className="accent-[var(--gold)]" defaultChecked />
                  Add a handwritten note
                </label>
                <input
                  value={giftNote}
                  onChange={(e) => setGiftNote(e.target.value)}
                  placeholder="Your note…"
                  className="input-field"
                />
                <label className="flex items-center gap-3 text-sm text-ivory/70">
                  <input type="checkbox" className="accent-[var(--gold)]" />
                  Send direct to recipient in Nairobi
                </label>
                <label className="flex items-center gap-3 text-sm text-ivory/70">
                  <input type="checkbox" className="accent-[var(--gold)]" defaultChecked />
                  Wrap with ribbon bag
                </label>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 mt-10">
              <button type="button" onClick={onAdd} className="btn-gold flex-1">
                {added ? "Added to bag" : "Add to bag"}
              </button>
              <a
                href={whatsappOrderUrl(waMessage)}
                target="_blank"
                rel="noreferrer"
                className="btn-ghost flex-1"
              >
                Order on WhatsApp
              </a>
            </div>

            <button
              type="button"
              onClick={() => toggleWishlist(product.slug)}
              className="mt-4 text-[0.65rem] tracking-[0.18em] uppercase text-ivory/50 hover:text-gold"
            >
              {wishlist.includes(product.slug) ? "Saved to wishlist" : "Save to wishlist"}
            </button>

            <ul className="mt-10 space-y-3 text-[0.7rem] tracking-[0.12em] uppercase text-ivory/45">
              <li>Pay with M-Pesa</li>
              <li>Nairobi delivery same day</li>
              <li>Free in-store alterations</li>
              <li>
                <Link href="/visit" className="text-gold hover:text-ivory">
                  Reserve to try
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Complete the look */}
        {pairs.length > 0 && (
          <section className="mt-24 md:mt-32">
            <p className="eyebrow">Complete the look</p>
            <h2 className="display text-3xl md:text-4xl mt-3 mb-10">Tie · Belt · Chino</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              {pairs.map((p) => (
                <Link key={p.slug} href={`/product/${p.slug}`} className="group">
                  <div className="relative aspect-[3/4] overflow-hidden">
                    <Image src={p.image} alt={p.name} fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                  </div>
                  <p className="display text-xl mt-4 group-hover:text-gold transition-colors">{p.name}</p>
                  <p className="text-gold text-sm mt-1">{formatKes(p.price)}</p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>

      {zoom && (
        <div
          className="fixed inset-0 z-[80] bg-noir/95 flex items-center justify-center p-6"
          onClick={() => setZoom(false)}
          onKeyDown={(e) => e.key === "Escape" && setZoom(false)}
          role="dialog"
        >
          <button
            type="button"
            className="absolute top-8 right-8 text-xs tracking-[0.2em] uppercase text-ivory/60"
          >
            Close
          </button>
          <div className="relative w-full max-w-4xl aspect-[4/5]">
            <Image src={images[activeImg]} alt={product.name} fill className="object-contain" />
          </div>
        </div>
      )}
    </div>
  );
}
