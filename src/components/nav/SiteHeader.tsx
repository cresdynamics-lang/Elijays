"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { track } from "@/lib/analytics";
import { useCart } from "@/lib/cart";
import {
  getEnabledCategories,
  getShopOpenStatus,
  navigationConfig,
} from "@/lib/navigation";
import { AnnouncementBar } from "@/components/nav/AnnouncementBar";
import { Logo } from "@/components/nav/Logo";
import {
  MegaMenuPanel,
  panelDomId,
  useFinePointer,
  useNavPanelController,
} from "@/components/nav/MegaMenu";
import { MobileDrawer } from "@/components/nav/MobileDrawer";
import { SearchOverlay } from "@/components/nav/SearchOverlay";
import { IconCart, IconHeart, IconMenu, IconSearch } from "@/components/Icons";

export function SiteHeader() {
  const categories = getEnabledCategories();
  const secondary = navigationConfig.secondary;
  const { count } = useCart();
  const pathname = usePathname();
  const finePointer = useFinePointer();
  const { openId, open, close, onTriggerActivate } =
    useNavPanelController(finePointer);

  const [scrolled, setScrolled] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [shopStatus, setShopStatus] = useState(() => getShopOpenStatus());
  const [isCompactNav, setIsCompactNav] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const update = () => setIsCompactNav(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    setShopStatus(getShopOpenStatus());
    const id = setInterval(() => setShopStatus(getShopOpenStatus()), 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      const target = e.target as Element | null;
      if (!target?.closest("[data-nav-root]")) close(true);
    };
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, [close]);

  const pageLabel =
    categories.find((c) => pathname.startsWith(c.slug))?.label ||
    (pathname === "/" ? "Home" : pathname);

  const openSearch = useCallback(() => {
    setSearchOpen(true);
    track({ name: "search_open" });
  }, []);

  const baseId = "elijays-mega";

  return (
    <>
      <div
        className={`shrink-0 transition-[height] duration-300 print:hidden ${
          isCompactNav ? "h-14" : scrolled ? "h-16" : "h-[6.25rem]"
        }`}
        aria-hidden
      />

      <header
        data-nav-root
        className="fixed inset-x-0 top-0 z-50 bg-noir/95 backdrop-blur-md print:hidden"
      >
        {!isCompactNav && <AnnouncementBar hidden={scrolled} />}

        {isCompactNav ? (
          <div className="flex h-14 items-center justify-between gap-2 px-4">
            <Logo size="sm" className="min-w-0" />
            <div className="flex shrink-0 items-center gap-0.5">
              <button
                type="button"
                onClick={openSearch}
                className="rounded-lg p-2.5 text-ivory/80 outline-none transition-colors hover:text-gold focus-visible:ring-2 focus-visible:ring-gold"
                aria-label="Search"
              >
                <IconSearch size={20} />
              </button>
              <Link
                href={secondary.account.href}
                className="nav-util rounded-lg px-2 py-2"
              >
                {secondary.account.label}
              </Link>
              <Link
                href={secondary.bag.href}
                className="relative rounded-lg p-2.5 text-ivory outline-none transition-colors hover:text-gold focus-visible:ring-2 focus-visible:ring-gold"
                aria-label={`Cart, ${count} items`}
              >
                <IconCart size={20} />
                {count > 0 && (
                  <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[0.55rem] font-medium text-noir">
                    {count}
                  </span>
                )}
              </Link>
              <button
                type="button"
                className="rounded-lg p-2.5 text-gold outline-none transition-colors hover:text-ivory focus-visible:ring-2 focus-visible:ring-gold"
                aria-label="Open menu"
                aria-expanded={drawerOpen}
                onClick={() => setDrawerOpen(true)}
              >
                <IconMenu size={22} />
              </button>
            </div>
          </div>
        ) : (
          <div className="relative">
            <div className="mx-auto grid h-16 max-w-[1600px] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 px-4 xl:h-[4.25rem] xl:gap-8 xl:px-8">
              <Logo size="sm" className="justify-self-start" />

              <nav
                aria-label="Primary"
                className="flex min-w-0 items-center justify-start gap-3 overflow-x-auto hide-scroll lg:gap-4 xl:gap-6"
              >
                {categories.map((cat) => (
                  <CategoryTrigger
                    key={cat.id}
                    label={cat.label}
                    href={cat.slug}
                    expanded={openId === cat.id}
                    controls={panelDomId(cat.id, baseId)}
                    compact
                    finePointer={finePointer}
                    onHoverStart={() => open(cat.id)}
                    onHoverEnd={() => close()}
                    onActivate={(e) => onTriggerActivate(cat.id, cat.slug, e)}
                    onFocus={() => open(cat.id, true)}
                  />
                ))}
              </nav>

              <div className="flex items-center justify-end gap-1 xl:gap-2">
                <button
                  type="button"
                  onClick={openSearch}
                  className="rounded-lg p-2.5 text-ivory/75 outline-none transition-colors hover:text-gold focus-visible:ring-2 focus-visible:ring-gold"
                  aria-label={secondary.search.label}
                >
                  <IconSearch size={20} />
                </button>
                <Link
                  href={secondary.account.href}
                  className="nav-util rounded-lg px-2 py-2"
                >
                  {secondary.account.label}
                </Link>
                <Link
                  href={secondary.wishlist.href}
                  className="rounded-lg p-2.5 text-ivory/75 outline-none transition-colors hover:text-gold focus-visible:ring-2 focus-visible:ring-gold"
                  aria-label={secondary.wishlist.label}
                >
                  <IconHeart size={18} />
                </Link>
                <Link
                  href={secondary.bag.href}
                  className="relative rounded-lg p-2.5 text-ivory outline-none transition-colors hover:text-gold focus-visible:ring-2 focus-visible:ring-gold"
                  aria-label={`Cart, ${count} items`}
                >
                  <IconCart size={20} />
                  {count > 0 && (
                    <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[0.55rem] font-medium text-noir">
                      {count}
                    </span>
                  )}
                </Link>
              </div>
            </div>

            {categories.map((cat) => (
              <MegaMenuPanel
                key={cat.id}
                category={cat}
                open={openId === cat.id}
                onClose={() => close(true)}
                panelId={panelDomId(cat.id, baseId)}
                finePointer={finePointer}
              />
            ))}
          </div>
        )}
      </header>

      <MobileDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSearch={() => {
          setDrawerOpen(false);
          openSearch();
        }}
        pageLabel={pageLabel}
        shopStatus={shopStatus.label}
      />

      {searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} />}

      <nav aria-label="Site categories" className="sr-only">
        {categories.map((cat) => (
          <div key={cat.id}>
            <a href={cat.slug}>{cat.label}</a>
            {cat.links.map((l) => (
              <a key={l.href + l.label} href={l.href}>
                {l.label}
              </a>
            ))}
          </div>
        ))}
      </nav>
    </>
  );
}

function CategoryTrigger({
  label,
  href,
  expanded,
  controls,
  finePointer,
  compact,
  onHoverStart,
  onHoverEnd,
  onActivate,
  onFocus,
}: {
  label: string;
  href: string;
  expanded: boolean;
  controls: string;
  finePointer: boolean;
  compact?: boolean;
  onHoverStart: () => void;
  onHoverEnd: () => void;
  onActivate: (e: React.MouseEvent | React.KeyboardEvent) => void;
  onFocus: () => void;
}) {
  return (
    <Link
      href={href}
      className={`nav-primary shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-noir ${
        compact ? "text-[0.6rem] lg:text-[0.65rem]" : ""
      } ${expanded ? "text-gold" : ""}`}
      aria-expanded={expanded}
      aria-controls={controls}
      aria-haspopup="true"
      onMouseEnter={() => {
        if (finePointer) onHoverStart();
      }}
      onMouseLeave={() => {
        if (finePointer) onHoverEnd();
      }}
      onFocus={onFocus}
      onClick={(e) => onActivate(e)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          if (!finePointer) onActivate(e);
          else {
            e.preventDefault();
            onHoverStart();
          }
        }
        if (e.key === "ArrowDown") {
          e.preventDefault();
          onHoverStart();
          const panel = document.getElementById(controls);
          const first = panel?.querySelector("a");
          (first as HTMLElement | undefined)?.focus();
        }
      }}
    >
      {label}
    </Link>
  );
}
