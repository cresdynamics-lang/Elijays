"use client";

export { MobileBar } from "@/components/nav/MobileBar";

import { IconWhatsApp } from "@/components/Icons";
import { track } from "@/lib/analytics";
import { BRAND } from "@/lib/constants";

/** Floating WhatsApp chat — bottom right, all viewports */
export function WhatsAppFab() {
  return (
    <a
      href={`${BRAND.whatsapp}?text=${encodeURIComponent("Hello ELIJAYS. I would like to speak with a stylist.")}`}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat on WhatsApp"
      onClick={() => track({ name: "whatsapp_click", page: "fab" })}
      className="fixed bottom-24 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_10px_28px_rgba(37,211,102,0.45)] transition hover:scale-105 hover:bg-[#20bd5a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#25D366] print:hidden md:bottom-6 md:right-6"
    >
      <IconWhatsApp size={30} />
    </a>
  );
}
