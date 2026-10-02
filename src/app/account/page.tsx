import type { Metadata } from "next";
import Link from "next/link";
import { BRAND } from "@/lib/constants";
import { navigationConfig } from "@/lib/navigation";

export const metadata: Metadata = {
  title: "Account",
  description: "Your ELIJAYS account.",
};

export default function AccountPage() {
  return (
    <div className="atmosphere min-h-screen px-5 pb-28 pt-16 md:px-8">
      <div className="mx-auto max-w-lg">
        <p className="eyebrow">{navigationConfig.secondary.account.label}</p>
        <h1 className="display mt-4 text-5xl">Your account</h1>
        <p className="whisper mt-5 text-xl">
          Orders, reserves and fittings stay with your stylist for now.
        </p>
        <p className="mt-8 text-sm leading-relaxed text-ivory/55">
          Message us on WhatsApp with your name and we will keep your sizes on
          file. Full account login arrives with the next release.
        </p>
        <a
          href={`${BRAND.whatsapp}?text=${encodeURIComponent("Hello ELIJAYS. I would like to set up my client profile.")}`}
          target="_blank"
          rel="noreferrer"
          className="btn-gold mt-10 inline-flex"
        >
          WhatsApp a stylist
        </a>
        <p className="mt-6">
          <Link href="/wishlist" className="text-sm text-gold">
            {navigationConfig.secondary.wishlist.label} →
          </Link>
        </p>
      </div>
    </div>
  );
}
