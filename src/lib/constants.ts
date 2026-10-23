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
  mapsUrl: "https://share.google/Njoe0DGCVIZ79L5q8",
  mapsEmbed:
    "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3988.816!2d36.8200918!3d-1.28338!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x182f118a48bb052b%3A0xb307d34cc7fda90b!2sEljay%27s%20Men%27s%20Wear!5e0!3m2!1sen!2ske",
  geo: { lat: -1.28338, lng: 36.8200918 },
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

export function shopLocationBlock(): string {
  return [
    `Location: ${BRAND.address.street}`,
    `${BRAND.address.junction}, ${BRAND.address.city}`,
    `Hours: ${BRAND.hours}`,
    `Map: ${BRAND.mapsUrl}`,
  ].join("\n");
}

export function whatsappFittingUrl(extra?: string): string {
  const msg = [
    "Hello ELIJAYS — I'd like to book a fitting.",
    extra?.trim() ? extra.trim() : "",
    "Please confirm an available time.",
    "",
    shopLocationBlock(),
  ]
    .filter((line) => line !== undefined)
    .join("\n");
  return whatsappOrderUrl(msg);
}

export function whatsappProductUpdateUrl(product: {
  name: string;
  sku?: string | null;
  shortLine?: string | null;
  priceKes?: number | string | null;
}): string {
  const price =
    product.priceKes !== undefined &&
    product.priceKes !== null &&
    product.priceKes !== ""
      ? formatKes(Number(product.priceKes) || 0)
      : "";
  const msg = [
    "ELIJAYS product update — please confirm this listing.",
    "",
    product.name,
    product.shortLine?.trim() || "",
    product.sku ? `SKU ${product.sku}` : "",
    price,
    "",
    shopLocationBlock(),
  ]
    .filter((line) => line !== "")
    .join("\n");
  return whatsappOrderUrl(msg);
}
