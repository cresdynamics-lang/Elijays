/**
 * Meta Pixel + dataLayer events for page views, catalogue browsing, and purchases.
 * Fires when analytics consent is granted (or always for Meta feed ops if configured).
 */
type MetaEvent =
  | { name: "PageView" }
  | { name: "ViewContent"; content_ids: string[]; content_type?: string; value?: number; currency?: string }
  | { name: "AddToCart"; content_ids: string[]; value?: number; currency?: string }
  | { name: "InitiateCheckout"; content_ids: string[]; value?: number; currency?: string; num_items?: number }
  | { name: "Purchase"; content_ids: string[]; value: number; currency?: string; num_items?: number }
  | { name: "Search"; search_string: string }
  | { name: "Browse"; content_category: string };

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
    elijaysConsentAnalytics?: boolean;
    fbq?: (...args: unknown[]) => void;
  }
}

function hasConsent(): boolean {
  if (typeof window === "undefined") return false;
  if (window.elijaysConsentAnalytics === true) return true;
  try {
    return localStorage.getItem("elijays-analytics-consent") === "granted";
  } catch {
    return false;
  }
}

const SITE =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
  "https://elijays-mens-wear.co.ke";

export function trackMeta(event: MetaEvent): void {
  if (typeof window === "undefined") return;
  if (!hasConsent()) return;

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: event.name,
    site: SITE,
    ...event,
  });

  if (typeof window.fbq === "function") {
    if (event.name === "PageView") {
      window.fbq("track", "PageView");
    } else if (event.name === "ViewContent") {
      window.fbq("track", "ViewContent", {
        content_ids: event.content_ids,
        content_type: event.content_type ?? "product",
        value: event.value,
        currency: event.currency ?? "KES",
      });
    } else if (event.name === "AddToCart") {
      window.fbq("track", "AddToCart", {
        content_ids: event.content_ids,
        value: event.value,
        currency: event.currency ?? "KES",
      });
    } else if (event.name === "InitiateCheckout") {
      window.fbq("track", "InitiateCheckout", {
        content_ids: event.content_ids,
        value: event.value,
        currency: event.currency ?? "KES",
        num_items: event.num_items,
      });
    } else if (event.name === "Purchase") {
      window.fbq("track", "Purchase", {
        content_ids: event.content_ids,
        value: event.value,
        currency: event.currency ?? "KES",
        num_items: event.num_items,
      });
    } else if (event.name === "Search") {
      window.fbq("track", "Search", { search_string: event.search_string });
    } else if (event.name === "Browse") {
      window.fbq("trackCustom", "Browse", {
        content_category: event.content_category,
      });
    }
  }

  window.dispatchEvent(new CustomEvent("elijays:meta", { detail: event }));
}

/** Legacy nav analytics — still consent-gated */
type NavEvent =
  | { name: "nav_open"; category: string }
  | { name: "nav_link_click"; category: string; sublink: string }
  | { name: "nav_cta_click"; category: string; cta: string }
  | { name: "whatsapp_click"; page: string }
  | { name: "search_open" };

export function track(event: NavEvent): void {
  if (typeof window === "undefined") return;
  if (!hasConsent()) return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: event.name, ...event });
  window.dispatchEvent(new CustomEvent("elijays:analytics", { detail: event }));
}

export { SITE as META_SITE_URL };
