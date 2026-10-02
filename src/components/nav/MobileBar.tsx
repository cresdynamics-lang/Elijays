"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { track } from "@/lib/analytics";
import { useCart } from "@/lib/cart";
import {
  getEnabledCategories,
  getWhatsAppStylistUrl,
  navigationConfig,
} from "@/lib/navigation";
import { IconBag, IconSearch } from "@/components/Icons";

export function MobileBar() {
  const { count } = useCart();
  const pathname = usePathname();
  const items = navigationConfig.mobileBar;
  const categories = getEnabledCategories();
  const pageLabel =
    categories.find((c) => pathname.startsWith(c.slug))?.label ||
    (pathname === "/" ? "Home" : pathname);

  return (
    <nav
      aria-label="Mobile shortcuts"
      className="fixed bottom-0 inset-x-0 z-50 border-t border-[var(--line)] bg-noir/95 backdrop-blur-md md:hidden"
    >
      <div className="grid grid-cols-5 text-center">
        {items.map((item) => {
          if (item.action === "search") {
            return (
              <Link
                key={item.id}
                href="/search"
                className="flex flex-col items-center justify-center gap-1 py-3 text-ivory/70"
                aria-label="Search"
                onClick={() => track({ name: "search_open" })}
              >
                <IconSearch size={18} />
              </Link>
            );
          }
          if (item.action === "whatsapp") {
            return (
              <a
                key={item.id}
                href={getWhatsAppStylistUrl(pageLabel)}
                target="_blank"
                rel="noreferrer"
                className="py-3.5 font-[family-name:var(--font-jost)] text-[0.6rem] uppercase tracking-[0.18em] text-gold"
                onClick={() =>
                  track({ name: "whatsapp_click", page: pageLabel })
                }
              >
                {item.label}
              </a>
            );
          }
          if (item.showCount) {
            return (
              <Link
                key={item.id}
                href={item.href || "/bag"}
                className="relative flex flex-col items-center justify-center gap-1 py-3 text-ivory/70"
                aria-label={`Bag, ${count} items`}
              >
                <IconBag size={18} />
                {count > 0 && (
                  <span className="absolute right-[28%] top-2 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-gold px-1 text-[0.5rem] text-noir">
                    {count}
                  </span>
                )}
              </Link>
            );
          }
          return (
            <Link
              key={item.id}
              href={item.href || "/"}
              className="py-3.5 font-[family-name:var(--font-jost)] text-[0.6rem] uppercase tracking-[0.18em] text-ivory/70"
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
