"use client";

import Image from "next/image";
import Link from "next/link";
import { BRAND, TRUST_STRIP, formatKes, whatsappFittingUrl } from "@/lib/constants";
import { getEnabledCategories } from "@/lib/navigation";
import { CategoryCard } from "@/components/CategoryCard";
import { completeLook, getNewArrivals, getProduct, looks } from "@/lib/products";
import { useCart } from "@/lib/cart";

const HERO_MODEL = {
  src: "/hero/hero-model.webp",
  alt: "Man in a navy suit at ELIJAYS",
  width: 986,
  height: 1000,
};

const OCCASIONS = [
  { title: "The Boardroom", meta: "Suits · Shirts · Ties", href: "/lookbook#boardroom", image: "/products/blazers.webp" },
  { title: "The Courtroom", meta: "Dark suits · White shirts", href: "/lookbook#courtroom", image: "/products/presidential-shirts.webp" },
  { title: "The Weekend", meta: "Vests · Printed shirts", href: "/lookbook#weekend", image: "/products/jackets-outer.webp" },
  { title: "The Wedding", meta: "Three-piece · Paisley", href: "/lookbook", image: "/products/suits.webp" },
  { title: "The Evening", meta: "Knits · Dark denim", href: "/lookbook#quiet-power", image: "/products/jeans.webp" },
];

const QUOTES = [
  {
    text: "The fit was right the first time. I walked into court and no one asked who made it.",
    role: "Advocate, Nairobi",
  },
  {
    text: "The hem was done while I waited. That is the house.",
    role: "Director, Westlands",
  },
  {
    text: "My groomsmen all looked like one family. That is Elijays.",
    role: "Groom, Karen",
  },
];

export default function HomePage() {
  const { addItem } = useCart();
  const arrivals = getNewArrivals(4);
  const wardrobe = getEnabledCategories();

  const addCompleteLook = () => {
    completeLook.pieces.forEach((slug) => {
      const p = getProduct(slug);
      if (p) addItem({ slug, qty: 1, size: p.sizes?.[2] || p.sizes?.[0] });
    });
  };

  return (
    <div>
      {/* Split hero: black copy | faded model — no carousel */}
      <section className="bg-noir">
        <div className="mx-auto grid min-h-[78svh] max-w-[1600px] lg:min-h-[min(88svh,820px)] lg:grid-cols-2">
          {/* Left: writing on black */}
          <div className="relative z-10 flex flex-col justify-center px-6 py-16 md:px-12 md:py-20 lg:px-16 lg:py-24">
            <p className="eyebrow animate-fade-up">{BRAND.tagline}</p>
            <h1 className="display mt-5 max-w-xl text-4xl text-ivory animate-fade-up delay-1 sm:text-5xl md:text-6xl lg:text-[4.25rem]">
              Command the room
              <br />
              <span className="text-gold">before you speak.</span>
            </h1>
            <p className="whisper mt-6 max-w-md text-lg animate-fade-up delay-2 md:text-xl">
              Suits, shirts and the finishing details that decide how a man is remembered.{" "}
              {BRAND.address.landmark}, Nairobi.
            </p>
            <div className="mt-9 flex flex-wrap gap-3 animate-fade-up delay-3">
              <Link href="/suits" className="btn-gold">
                Shop the collection
              </Link>
              <a
                href={whatsappFittingUrl()}
                target="_blank"
                rel="noreferrer"
                className="btn-ghost"
              >
                Book a fitting
              </a>
            </div>
          </div>

          {/* Right: model faded into black */}
          <div className="relative min-h-[52svh] overflow-hidden bg-noir lg:min-h-0">
            <Image
              src={HERO_MODEL.src}
              alt={HERO_MODEL.alt}
              width={HERO_MODEL.width}
              height={HERO_MODEL.height}
              priority
              quality={70}
              sizes="(max-width:1024px) 100vw, 50vw"
              className="absolute inset-0 h-full w-full object-cover object-[center_15%] opacity-[0.72] lg:opacity-[0.78]"
            />
            {/* Soft fade into the black copy panel */}
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-r from-noir via-noir/25 to-transparent lg:via-noir/35"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-noir/55 via-transparent to-noir/20"
              aria-hidden
            />
          </div>
        </div>
      </section>

      <section className="border-y border-[var(--line)] bg-noir-soft/60">
        <div className="mx-auto max-w-[1600px] overflow-x-auto px-5 py-4 hide-scroll md:px-8 lg:px-12">
          <ul className="flex min-w-max items-center justify-between gap-8 md:min-w-0">
            {TRUST_STRIP.map((t) => (
              <li
                key={t}
                className="whitespace-nowrap text-[0.65rem] uppercase tracking-[0.22em] text-ivory/55"
              >
                {t}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section-pad-light">
        <div className="mx-auto max-w-[1600px]">
          <div className="mb-10 flex items-end justify-between gap-6 md:mb-12">
            <div>
              <p className="eyebrow">The Wardrobe</p>
              <h2 className="display mt-3 text-3xl md:text-5xl">Nine doors in.</h2>
            </div>
            <Link
              href="/shirts"
              className="hidden text-[0.65rem] uppercase tracking-[0.2em] text-gold transition-colors hover:text-ivory sm:inline"
            >
              Shop everything →
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-5 lg:grid-cols-3">
            {wardrobe.map((w, i) => (
              <CategoryCard
                key={w.slug}
                index={i}
                label={w.label}
                subline={w.page.subline}
                href={w.slug}
                links={w.links}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="section-pad-light pt-0">
        <div className="mx-auto max-w-[1600px]">
          <div className="mb-10 max-w-2xl md:mb-12">
            <p className="eyebrow">Occasions</p>
            <h2 className="display mt-3 text-3xl md:text-5xl">
              Shop by the room you are walking into
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-5 md:gap-4">
            {OCCASIONS.map((o) => (
              <Link
                key={o.title}
                href={o.href}
                className="group relative min-h-[260px] overflow-hidden rounded-xl md:min-h-[380px]"
              >
                <Image
                  src={o.image}
                  alt={o.title}
                  fill
                  sizes="(max-width:768px) 100vw, 20vw"
                  quality={60}
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-noir/45 transition-colors group-hover:bg-noir/30" />
                <div className="absolute inset-x-0 bottom-0 p-4 md:p-5">
                  <h3 className="display text-xl text-ivory md:text-2xl">{o.title}</h3>
                  <p className="mt-1.5 text-[0.6rem] uppercase tracking-[0.18em] text-gold/80">
                    {o.meta}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section-pad-light pt-0">
        <div className="mx-auto max-w-[1600px]">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <p className="eyebrow">New through the door</p>
              <h2 className="display mt-3 text-3xl md:text-4xl">Arrivals</h2>
            </div>
            <Link href="/shirts" className="text-[0.65rem] uppercase tracking-[0.2em] text-gold">
              All new arrivals →
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {arrivals.map((p) => (
              <Link key={p.id} href={`/product/${p.slug}`} className="group">
                <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-noir-elevated">
                  <Image
                    src={p.image}
                    alt={p.name}
                    fill
                    sizes="25vw"
                    quality={65}
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <h3 className="display mt-4 text-xl transition-colors group-hover:text-gold">
                  {p.name}
                </h3>
                <p className="mt-1 text-[0.65rem] uppercase tracking-[0.16em] text-ivory/45">
                  {p.subtitle}
                </p>
                <p className="mt-2 text-sm text-gold">{formatKes(p.price)}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-[var(--line)] bg-noir-soft/40">
        <div className="mx-auto grid max-w-[1600px] items-center gap-10 px-5 py-14 md:px-8 md:py-20 lg:grid-cols-2 lg:gap-14 lg:px-12">
          <div>
            <p className="eyebrow">Complete the look</p>
            <h2 className="display mt-3 text-4xl md:text-5xl">
              One look.
              <br />
              Five pieces.
            </h2>
            <p className="whisper mt-5 text-lg md:text-xl">Add the whole outfit in one tap.</p>
            <ul className="mt-8 space-y-3">
              {completeLook.pieces.map((slug) => {
                const p = getProduct(slug);
                return (
                  <li
                    key={slug}
                    className="flex justify-between border-b border-[var(--line)] pb-2 text-sm text-ivory/70"
                  >
                    <span>{p?.name}</span>
                    <span className="text-ivory/40">{p ? formatKes(p.price) : ""}</span>
                  </li>
                );
              })}
            </ul>
            <div className="mt-8 flex flex-wrap items-center gap-6">
              <button type="button" onClick={addCompleteLook} className="btn-gold">
                Add the look
              </button>
              <div>
                <p className="text-lg text-gold">{formatKes(completeLook.bundlePrice)}</p>
                <p className="mt-1 text-[0.65rem] uppercase tracking-[0.15em] text-ivory/45">
                  {completeLook.saveLabel}
                </p>
              </div>
            </div>
          </div>
          <div className="relative ml-auto aspect-[4/5] w-full max-w-md overflow-hidden rounded-xl">
            <Image
              src="/hero/hero-shirts.webp"
              alt="Complete look"
              fill
              sizes="40vw"
              quality={65}
              className="object-cover"
            />
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-br from-purple/15 via-noir to-noir">
        <div className="mx-auto max-w-[1600px] px-5 py-16 text-center md:px-8 md:py-20 lg:px-12">
          <p className="eyebrow">Bespoke</p>
          <h2 className="display mt-4 text-4xl md:text-6xl">
            Made for one man.
            <br />
            <span className="text-gold">Cut for you.</span>
          </h2>
          <a
            href={whatsappFittingUrl()}
            target="_blank"
            rel="noreferrer"
            className="btn-gold mt-8 inline-flex"
          >
            Book your fitting
          </a>
        </div>
      </section>

      <section className="section-pad-light">
        <div className="mx-auto max-w-[1600px]">
          <p className="eyebrow">Clients</p>
          <h2 className="display mb-10 mt-3 text-3xl md:text-4xl">
            Words from men who walked in
          </h2>
          <div className="grid gap-8 md:grid-cols-3 md:gap-10">
            {QUOTES.map((q) => (
              <blockquote key={q.role} className="border-t border-[var(--line)] pt-6">
                <p className="whisper text-xl leading-snug md:text-2xl">&ldquo;{q.text}&rdquo;</p>
                <footer className="mt-5 text-[0.65rem] uppercase tracking-[0.2em] text-gold">
                  {q.role}
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      <section className="section-pad-light pt-0">
        <div className="mx-auto grid max-w-[1600px] items-stretch gap-6 lg:grid-cols-2 lg:gap-8">
          <div className="relative min-h-[360px] overflow-hidden rounded-xl">
            <Image
              src="/brand/elijays-storefront.webp"
              alt="ELIJAYS storefront"
              fill
              sizes="50vw"
              quality={65}
              className="object-cover"
            />
          </div>
          <div className="flex flex-col justify-center rounded-xl border border-[var(--line)] bg-noir-soft/50 p-8 md:p-12">
            <p className="eyebrow">Visit the house</p>
            <h2 className="display mt-3 text-3xl md:text-4xl">{BRAND.address.street}</h2>
            <p className="mt-5 max-w-md leading-relaxed text-ivory/65">
              {BRAND.address.junction}, {BRAND.address.city}. Open six days, 8am to 8pm.
            </p>
            <p className="mt-3 text-sm text-ivory/45">{BRAND.hours}</p>
            <p className="mt-2 text-sm text-gold">WhatsApp {BRAND.phone}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href={BRAND.mapsUrl} target="_blank" rel="noreferrer" className="btn-gold">
                Get directions
              </a>
              <Link href="/visit" className="btn-ghost">
                Visit details
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 pb-20 md:px-8 lg:px-12">
        <div className="mx-auto max-w-[1600px]">
          <div className="mb-8 flex items-end justify-between">
            <h2 className="display text-2xl md:text-3xl">
              Dress for the room you intend to own.
            </h2>
            <Link
              href="/lookbook"
              className="hidden text-[0.65rem] uppercase tracking-[0.2em] text-gold sm:block"
            >
              Lookbook →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
            {looks.map((l) => (
              <Link
                key={l.id}
                href={`/lookbook#${l.id}`}
                className="group relative aspect-[3/4] overflow-hidden rounded-xl"
              >
                <Image
                  src={l.image}
                  alt={l.title}
                  fill
                  sizes="16vw"
                  quality={60}
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-noir/40" />
                <p className="absolute bottom-3 left-3 right-3 text-xs uppercase tracking-[0.12em] text-ivory">
                  {l.title}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
