/** Live storefront domain (elijays.co.ke later; mens-wear until then). */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_APP_URL || "https://elijays-mens-wear.co.ke"
).replace(/\/$/, "");

export const BRAND = {
  name: "ELIJAYS",
  fullName: "ELIJAYS Men's Wear",
  tagline: "Suits · Shirts · Trousers",
  heroLine: "Command the room before you speak.",
  voiceLine: "Some men arrive. Others are announced by their suit.",
  phone: "0708 269209",
  phoneE164: "254708269209",
  whatsapp: "https://wa.me/254708269209",
  email: "hello@elijays.co.ke",
  instagram: "https://instagram.com/elijaysmenswear",
  address: {
    street: "Muindi Mbingu Street",
    junction: "Junction with Biashara Street, opposite Equity Bank",
    city: "Nairobi CBD",
    landmark: "Muindi Mbingu × Biashara, opposite Equity Bank",
  },
  hours: "Monday to Saturday, 8am to 8pm",
  mapsUrl:
    "https://www.google.com/maps/search/?api=1&query=Muindi+Mbingu+Street+Biashara+Street+Equity+Bank+Nairobi",
} as const;

export const TRUST_STRIP = [
  "Bespoke Tailoring",
  "Free In-Store Alterations",
  "Nairobi Delivery",
  "Pay with M-Pesa",
  "WhatsApp Ordering",
] as const;

export function formatKes(amount: number): string {
  return `KES ${amount.toLocaleString("en-KE")}`;
}

export function whatsappOrderUrl(message: string): string {
  return `${BRAND.whatsapp}?text=${encodeURIComponent(message)}`;
}
