export { MobileBar } from "@/components/nav/MobileBar";

import { BRAND } from "@/lib/constants";

/** Desktop floating WhatsApp — page-aware message set by consumers when needed */
export function WhatsAppFab() {
  return (
    <a
      href={`${BRAND.whatsapp}?text=${encodeURIComponent("Hello ELIJAYS. I would like to speak with a stylist.")}`}
      target="_blank"
      rel="noreferrer"
      className="fixed bottom-20 right-5 z-40 hidden items-center gap-2 rounded-xl bg-gold px-4 py-3 font-[family-name:var(--font-jost)] text-[0.65rem] uppercase tracking-[0.18em] text-noir shadow-[0_0_40px_var(--gold-glow)] transition-colors hover:bg-[#f0d9a8] md:flex"
    >
      WhatsApp a stylist
    </a>
  );
}
