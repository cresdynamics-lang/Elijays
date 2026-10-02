import type { Metadata } from "next";
import { BRAND } from "@/lib/constants";

export const metadata: Metadata = { title: "FAQ" };

const FAQS = [
  {
    q: "Are the pieces original and imported?",
    a: "Yes. Every piece on the site is what we stock on Kimathi Street. Ask a stylist if you want the story behind a cloth.",
  },
  {
    q: "Do you alter in-store?",
    a: "Free in-store alterations on every purchase. Many hems are done while you wait.",
  },
  {
    q: "Can I order on WhatsApp?",
    a: `Yes. Message ${BRAND.phone} with the product you want, or use Order on WhatsApp from any product page.`,
  },
  {
    q: "Do you accept M-Pesa?",
    a: "Yes. M-Pesa, card, and pay on delivery for Nairobi orders.",
  },
  {
    q: "Same-day delivery?",
    a: "Nairobi same-day delivery is available on orders placed early enough. Confirm with a stylist.",
  },
  {
    q: "Can I reserve to try?",
    a: "Pick items online and we will hold your size for 24 hours. Visit Us for details.",
  },
];

export default function FaqPage() {
  return (
    <div className="atmosphere min-h-screen pt-28 md:pt-36 pb-28">
      <div className="mx-auto max-w-3xl px-5 md:px-8">
        <p className="eyebrow">Support</p>
        <h1 className="display text-5xl mt-4">FAQ</h1>
        <div className="mt-14 space-y-8">
          {FAQS.map((f) => (
            <details
              key={f.q}
              className="border-b border-[var(--line)] pb-6 group"
              open
            >
              <summary className="display text-xl cursor-pointer list-none text-ivory group-open:text-gold">
                {f.q}
              </summary>
              <p className="mt-4 text-ivory/55 leading-relaxed">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}
