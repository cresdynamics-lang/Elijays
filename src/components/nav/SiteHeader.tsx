"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { track } from "@/lib/analytics";
import { useCart } from "@/lib/cart";
import {
  getEnabledCategories,
  getShopOpenStatus,
  getWhatsAppStylistUrl,
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
import { IconBag, IconHeart, IconMenu, IconSearch } from "@/components/Icons";

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
  const whatsappHref = getWhatsAppStylistUrl(pageLabel);

  const openSearch = useCallback(() => {
    setSearchOpen(true);
    track({ name: "search_open" });
  }, []);

  const baseId = "elijays-mega";

  return (
    <>
      {/* Spacer prevents layout shift: announcement 36 + tiers */}
      <div
        className={`shrink-0 transition-[height] duration-300 ${
          isCompactNav
            ? "h-14"
            : scrolled
              ? "h-16"
              : "h-[9.5rem] xl:h-[10.25rem]"
        }`}
        aria-hidden
      />

      <header
        data-nav-root
        className="fixed inset-x-0 top-0 z-50 bg-noir/95 backdrop-blur-md"
      >
        {!isCompactNav && <AnnouncementBar hidden={scrolled} />}

        {/* Compact mobile / iPad portrait bar: logo left, icons + menu right */}
        {isCompactNav ? (
          <div className="flex h-14 items-center justify-between gap-3 px-4">
            <Logo size="sm" />
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={openSearch}
                className="rounded-lg p-2.5 text-ivory/80 outline-none transition-colors hover:text-gold focus-visible:ring-2 focus-visible:ring-gold"
                aria-label="Search"
              >
                <IconSearch size={20} />
              </button>
              <Link
                href={secondary.bag.href}
                className="relative rounded-lg p-2.5 text-ivory outline-none transition-colors hover:text-gold focus-visible:ring-2 focus-visible:ring-gold"
                aria-label={`Bag, ${count} items`}
              >
                <IconBag size={20} />
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
          <>
            {/* Tier 2 / collapsed single row */}
            <div
              className={`relative mx-auto flex max-w-[1600px] items-center px-4 transition-[height] duration-300 xl:px-8 ${
                scrolled ? "h-16" : "h-16 xl:h-[4.5rem]"
              }`}
            >
              {/* Left utilities */}
              <div
                className={`flex items-center gap-4 xl:gap-6 ${
                  scrolled ? "order-2 ml-6" : ""
                }`}
              >
                {!scrolled && (
                  <>
                    <Link
                      href={secondary.bespoke.href}
                      className="nav-util text-gold"
                      title={secondary.bespoke.lead}
                    >
                      {secondary.bespoke.label}
                    </Link>
                    <Link href={secondary.visit.href} className="nav-util hidden xl:inline-flex items-center gap-2">
                      {secondary.visit.label}
                      <span className="text-[0.55rem] tracking-[0.12em] text-gold/80 normal-case">
                        {shopStatus.label}
                      </span>
                    </Link>
                    <a
                      href={whatsappHref}
                      target="_blank"
                      rel="noreferrer"
                      className="nav-util hidden xl:inline-flex"
                      onClick={() =>
                        track({ name: "whatsapp_click", page: pageLabel })
                      }
                    >
                      {secondary.whatsapp.label}
                    </a>
                  </>
                )}
                {scrolled && <Logo size="sm" />}
              </div>

              {/* Centre logo (expanded only) */}
              {!scrolled && (
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                  <Logo />
                </div>
              )}

              {/* Scrolled: categories centre */}
              {scrolled && (
                <nav
                  aria-label="Primary"
                  className="order-3 mx-auto flex items-center justify-center gap-3 lg:gap-4 xl:gap-5"
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
                      onActivate={(e) =>
                        onTriggerActivate(cat.id, cat.slug, e)
                      }
                      onFocus={() => open(cat.id, true)}
                    />
                  ))}
                </nav>
              )}

              {/* Right utilities */}
              <div className={`ml-auto flex items-center gap-1 xl:gap-2 ${scrolled ? "order-4" : ""}`}>
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
                  className="nav-util hidden rounded-lg px-2 py-2 xl:inline"
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
                  aria-label={`Bag, ${count} items`}
                >
                  <IconBag size={20} />
                  {count > 0 && (
                    <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[0.55rem] font-medium text-noir">
                      {count}
                    </span>
                  )}
                </Link>
                {scrolled && (
                  <Link href={secondary.bespoke.href} className="nav-util hidden rounded-lg px-2 text-gold lg:inline">
                    {secondary.bespoke.label}
                  </Link>
                )}
              </div>
            </div>

            {/* Tier 3: primary categories (expanded) */}
            {!scrolled && (
              <div className="relative border-b border-[var(--line)]">
                <nav
                  aria-label="Primary"
                  className="mx-auto flex max-w-[1600px] items-center justify-center gap-3 px-3 py-3 lg:gap-[0.85rem] lg:px-4 xl:gap-6 xl:px-8"
                >
                  {categories.map((cat) => (
                    <CategoryTrigger
                      key={cat.id}
                      label={cat.label}
                      href={cat.slug}
                      expanded={openId === cat.id}
                      controls={panelDomId(cat.id, baseId)}
                      finePointer={finePointer}
                      onHoverStart={() => open(cat.id)}
                      onHoverEnd={() => close()}
                      onActivate={(e) =>
                        onTriggerActivate(cat.id, cat.slug, e)
                      }
                      onFocus={() => open(cat.id, true)}
                    />
                  ))}
                </nav>

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

            {/* Panels when scrolled (attached under collapsed bar) */}
            {scrolled &&
              categories.map((cat) => (
                <MegaMenuPanel
                  key={`scrolled-${cat.id}`}
                  category={cat}
                  open={openId === cat.id}
                  onClose={() => close(true)}
                  panelId={panelDomId(cat.id, baseId)}
                  finePointer={finePointer}
                />
              ))}
          </>
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

      {/* SSR crawlable links for engines (visually hidden) */}
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
      className={`nav-primary outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-noir ${
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
