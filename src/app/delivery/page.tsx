import type { Metadata } from "next";
import Link from "next/link";
import { BRAND } from "@/lib/constants";

export const metadata: Metadata = { title: "Delivery & Returns" };

export default function DeliveryPage() {
  return (
    <div className="atmosphere min-h-screen pt-28 md:pt-36 pb-28">
      <div className="mx-auto max-w-3xl px-5 md:px-8">
        <p className="eyebrow">Service</p>
        <h1 className="display text-5xl mt-4">Delivery & returns</h1>
        <div className="mt-12 space-y-10 text-ivory/65 leading-relaxed">
          <div>
            <h2 className="display text-2xl text-ivory">Nairobi delivery</h2>
            <p className="mt-3">
              Free delivery within Nairobi on qualifying orders. Same-day options available —
              confirm timing with a stylist on WhatsApp.
            </p>
          </div>
          <div>
            <h2 className="display text-2xl text-ivory">Returns</h2>
            <p className="mt-3">
              Unaltered pieces in original condition may be returned or exchanged within 7 days.
              Altered garments are final sale except for fit adjustments we make for you.
            </p>
          </div>
          <div>
            <h2 className="display text-2xl text-ivory">Authenticity promise</h2>
            <p className="mt-3">
              Documented and stocked on Kimathi Street. If it is on the site, it is in the house.
            </p>
          </div>
        </div>
        <a href={BRAND.whatsapp} className="btn-gold mt-12 inline-flex">
          Ask a stylist
        </a>
        <p className="mt-6">
          <Link href="/faq" className="text-gold text-sm tracking-widest uppercase">
            More FAQ →
          </Link>
        </p>
      </div>
    </div>
  );
}
