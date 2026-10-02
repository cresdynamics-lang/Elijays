import navigation from "@/content/navigation.json";

export type NavImage = {
  src: string;
  alt: string;
  width: number;
  height: number;
};

export type NavLink = {
  label: string;
  descriptor: string;
  href: string;
  image?: NavImage;
};

export type NavCategory = {
  id: string;
  enabled: boolean;
  label: string;
  slug: string;
  headline: string;
  subline: string;
  cta: { label: string; href: string };
  image: NavImage;
  page: {
    h1: string;
    subline: string;
    intro: string;
    seo: string;
    metaTitle: string;
    sizeGuideHref: string;
  };
  links: NavLink[];
};

export type NavigationConfig = {
  announcements: { id: string; text: string }[];
  secondary: {
    bespoke: { label: string; href: string; lead: string };
    visit: { label: string; href: string };
    whatsapp: { label: string; messageTemplate: string };
    search: { label: string; href: string };
    account: { label: string; href: string };
    wishlist: { label: string; href: string };
    bag: { label: string; href: string };
  };
  primary: NavCategory[];
  mobileBar: {
    id: string;
    label: string;
    href?: string;
    action?: "search" | "whatsapp";
    showCount?: boolean;
  }[];
};

export const navigationConfig = navigation as NavigationConfig;

export function getEnabledCategories(): NavCategory[] {
  return navigationConfig.primary.filter((c) => c.enabled);
}

export function getCategoryById(id: string): NavCategory | undefined {
  return getEnabledCategories().find((c) => c.id === id);
}

export function getCategoryBySlug(slug: string): NavCategory | undefined {
  const normalized = slug.startsWith("/") ? slug : `/${slug}`;
  return getEnabledCategories().find((c) => c.slug === normalized);
}

export function getNeighborCategories(id: string): {
  prev?: NavCategory;
  next?: NavCategory;
} {
  const cats = getEnabledCategories();
  const idx = cats.findIndex((c) => c.id === id);
  if (idx < 0) return {};
  return {
    prev: cats[idx - 1],
    next: cats[idx + 1],
  };
}

export function getWhatsAppStylistUrl(pageLabel: string): string {
  const template = navigationConfig.secondary.whatsapp.messageTemplate;
  const message = template.replace("{page}", pageLabel);
  return `https://wa.me/254708269209?text=${encodeURIComponent(message)}`;
}

/**
 * Storefront hours only (Kimathi Street, Mon–Sat 8am–8pm).
 * Online ordering, WhatsApp and the bag stay available 24/7.
 */
export function getShopOpenStatus(now = new Date()): {
  open: boolean;
  label: string;
} {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Nairobi",
    weekday: "short",
    hour: "numeric",
    hour12: false,
  }).formatToParts(now);

  const weekday = parts.find((p) => p.type === "weekday")?.value ?? "";
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
  const isSunday = weekday === "Sun";
  const open = !isSunday && hour >= 8 && hour < 20;

  if (open) {
    return { open: true, label: "Store open now · Online 24/7" };
  }
  if (isSunday) {
    return {
      open: false,
      label: "Store closed Sunday · Order online anytime",
    };
  }
  return {
    open: false,
    label: "Store closed · Order online anytime",
  };
}
