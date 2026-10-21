import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BRAND } from "@/lib/constants";

export const metadata: Metadata = {
  title: "The House",
  description: "We dress men who walk in with somewhere to be.",
};

const PROMISES = [
  {
    title: "Present",
    text: "Pieces chosen for the rooms you walk into.",
  },
  {
    title: "Bespoke",
    text: "Cut to your measure when the rail is not enough.",
  },
  {
    title: "Fitted",
    text: "Free in-store alterations on every purchase.",
  },
  {
    title: "Served",
    text: "A named stylist for every client.",
  },
];

export default function TheHousePage() {
  return (
    <div className="atmosphere min-h-screen pt-28 md:pt-36 pb-28">
      <div className="mx-auto max-w-[1600px] px-5 md:px-8 lg:px-12">
        <p className="eyebrow">The House</p>
        <h1 className="display text-5xl md:text-7xl mt-4 max-w-4xl">
          We dress men who walk in with somewhere to be.
        </h1>
        <p className="mt-8 text-lg text-ivory/60 max-w-2xl leading-relaxed">
          ELIJAYS is a men&apos;s house on Muindi Mbingu Street. We stock the wardrobe,
          tailor what needs tailoring, and stand behind the fit.
        </p>

        <div className="grid lg:grid-cols-2 gap-10 mt-16">
          <div className="relative min-h-[480px] overflow-hidden">
            <Image
              src="/brand/elijays-brand-sign.png"
              alt="ELIJAYS shop sign"
              fill
              className="object-cover"
            />
          </div>
          <div className="relative min-h-[480px] overflow-hidden">
            <Image
              src="/brand/elijays-storefront.jpg"
              alt="Storefront"
              fill
              className="object-cover"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-10 mt-20 md:mt-28">
          {PROMISES.map((p) => (
            <div key={p.title} className="border-t border-[var(--line)] pt-8">
              <h2 className="display text-2xl text-gold">{p.title}</h2>
              <p className="mt-4 text-ivory/55 leading-relaxed">{p.text}</p>
            </div>
          ))}
        </div>

        <div className="mt-24 border border-[var(--line)] p-10 md:p-16 bg-noir-soft/40 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div>
            <p className="eyebrow">Your stylist</p>
            <h2 className="display text-3xl md:text-4xl mt-3">Meet your stylist</h2>
            <p className="mt-4 text-ivory/55 max-w-md">
              A named stylist on WhatsApp for fittings, reserves, and the whole outfit.
            </p>
          </div>
          <a
            href={`${BRAND.whatsapp}?text=${encodeURIComponent("Hello ELIJAYS — I'd like to meet a stylist.")}`}
            target="_blank"
            rel="noreferrer"
            className="btn-gold"
          >
            WhatsApp {BRAND.phone}
          </a>
        </div>

        <div className="mt-16 flex flex-wrap gap-6 text-sm text-ivory/50">
          <Link href="/delivery" className="hover:text-gold">
            Delivery & returns
          </Link>
          <Link href="/faq" className="hover:text-gold">
            Authenticity & FAQ
          </Link>
          <Link href="/size-guide" className="hover:text-gold">
            Size guide
          </Link>
        </div>
      </div>
    </div>
  );
}
