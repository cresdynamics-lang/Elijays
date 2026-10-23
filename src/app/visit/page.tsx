import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BRAND, whatsappFittingUrl } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Visit Us",
  description: "Muindi Mbingu Street at the Biashara Street junction, opposite Equity Bank, Nairobi CBD.",
};

export default function VisitPage() {
  return (
    <div className="atmosphere min-h-screen pt-28 md:pt-36 pb-28">
      <div className="mx-auto max-w-[1600px] px-5 md:px-8 lg:px-12">
        <p className="eyebrow">Visit us</p>
        <h1 className="display text-5xl md:text-7xl mt-4">
          Muindi Mbingu Street, Nairobi
        </h1>
        <p className="whisper text-2xl md:text-3xl mt-6">The door is open.</p>

        <div className="grid lg:grid-cols-2 gap-10 mt-14">
          <div className="relative min-h-[480px] overflow-hidden border border-[var(--line)]">
            <Image
              src="/brand/elijays-storefront.jpg"
              alt="ELIJAYS on Muindi Mbingu Street"
              fill
              className="object-cover"
            />
          </div>
          <div className="flex flex-col justify-center space-y-8">
            <div>
              <p className="text-[0.65rem] tracking-[0.2em] uppercase text-gold mb-2">
                Address
              </p>
              <p className="text-lg text-ivory/80 leading-relaxed">
                {BRAND.address.street}
                <br />
                {BRAND.address.junction}
                <br />
                {BRAND.address.city}
              </p>
            </div>
            <div>
              <p className="text-[0.65rem] tracking-[0.2em] uppercase text-gold mb-2">
                Hours
              </p>
              <p className="text-lg text-ivory/80">{BRAND.hours}</p>
              <p className="mt-2 text-sm text-ivory/50">
                The storefront keeps those hours. The website stays open. Order, WhatsApp and checkout work anytime.
              </p>
            </div>
            <div>
              <p className="text-[0.65rem] tracking-[0.2em] uppercase text-gold mb-2">
                Landmark
              </p>
              <p className="text-lg text-ivory/80">
                Opposite Equity Bank, at the junction with Biashara Street. Nearby parking available in the CBD.
              </p>
            </div>
            <div>
              <p className="text-[0.65rem] tracking-[0.2em] uppercase text-gold mb-2">
                WhatsApp
              </p>
              <a href={BRAND.whatsapp} className="text-lg text-ivory hover:text-gold">
                {BRAND.phone}
              </a>
            </div>
            <div className="flex flex-wrap gap-4 pt-4">
              <a
                href={BRAND.mapsUrl}
                target="_blank"
                rel="noreferrer"
                className="btn-gold"
              >
                Get directions
              </a>
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
        </div>

        <div className="mt-16 border border-[var(--line)] p-8 md:p-12 bg-noir-soft/40">
          <p className="eyebrow">Reserve and try</p>
          <h2 className="display text-3xl mt-3">Hold your size for 24 hours</h2>
          <p className="mt-4 text-ivory/55 max-w-xl leading-relaxed">
            Pick any items online and we will hold them in your size for 24 hours.
            Message a stylist with your bag.
          </p>
          <div className="flex flex-wrap gap-4 mt-8">
            <Link href="/bag" className="btn-ghost">
              Open bag
            </Link>
            <a
              href={`${BRAND.whatsapp}?text=${encodeURIComponent("Hello ELIJAYS — I'd like to reserve items to try in store.")}`}
              target="_blank"
              rel="noreferrer"
              className="btn-gold"
            >
              Reserve on WhatsApp
            </a>
          </div>
        </div>

        <div className="mt-10 aspect-[21/9] min-h-[240px] border border-[var(--line)] relative overflow-hidden bg-noir-elevated">
          <iframe
            title="ELIJAYS location map"
            className="absolute inset-0 w-full h-full grayscale opacity-80"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            src={BRAND.mapsEmbed}
          />
        </div>
      </div>
    </div>
  );
}
