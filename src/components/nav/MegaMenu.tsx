"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { track } from "@/lib/analytics";
import type { NavCategory, NavImage, NavLink } from "@/lib/navigation";

type Props = {
  category: NavCategory;
  open: boolean;
  onClose: () => void;
  panelId: string;
  finePointer: boolean;
};

export function MegaMenuPanel({
  category,
  open,
  onClose,
  panelId,
  finePointer,
}: Props) {
  const [activeImage, setActiveImage] = useState<NavImage>(category.image);
  const [fadeKey, setFadeKey] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setActiveImage(category.image);
      setFadeKey((k) => k + 1);
    }
  }, [open, category]);

  const swapImage = useCallback(
    (link?: NavLink) => {
      const next = link?.image ?? category.image;
      setActiveImage(next);
      setFadeKey((k) => k + 1);
      if (link?.image) {
        const preload = new window.Image();
        preload.src = link.image.src;
      }
    },
    [category.image]
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const mid = Math.ceil(category.links.length / 2);
  const colA = category.links.slice(0, mid);
  const colB = category.links.slice(mid);

  return (
    <div
      id={panelId}
      role="region"
      aria-label={`${category.label} menu`}
      className="absolute inset-x-0 top-full z-40 border-b border-[var(--line)] bg-noir/98 backdrop-blur-md motion-safe:animate-[mega-in_240ms_ease-out]"
      onMouseLeave={() => {
        if (finePointer) onClose();
      }}
    >
      <div className="mx-auto grid max-w-[1280px] grid-cols-1 gap-8 px-6 py-8 lg:grid-cols-[1.1fr_0.65fr] lg:gap-12 lg:px-10 lg:py-10">
        <div
          ref={listRef}
          className="grid grid-cols-1 gap-x-10 gap-y-1 sm:grid-cols-2"
        >
          {[colA, colB].map((col, ci) => (
            <ul key={ci} className="space-y-1">
              {col.map((link) => (
                <li key={link.href + link.label}>
                  <Link
                    href={link.href}
                    className="group block rounded-sm px-2 py-2.5 outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-noir"
                    onMouseEnter={() => {
                      if (finePointer) swapImage(link);
                    }}
                    onFocus={() => swapImage(link)}
                    onClick={() => {
                      track({
                        name: "nav_link_click",
                        category: category.id,
                        sublink: link.label,
                      });
                      onClose();
                    }}
                  >
                    <span className="block font-[family-name:var(--font-jost)] text-[0.7rem] font-normal uppercase tracking-[0.16em] text-ivory transition-colors group-hover:text-gold">
                      {link.label}
                    </span>
                    <span className="mt-1 block font-[family-name:var(--font-jost)] text-[0.75rem] font-light text-ivory/45">
                      {link.descriptor}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ))}
        </div>

        <aside className="relative mx-auto w-full max-w-[280px] overflow-hidden lg:mx-0 lg:max-w-[380px]">
          <div className="relative aspect-[4/5] w-full bg-noir-elevated">
            <Image
              key={fadeKey}
              src={activeImage.src}
              alt={activeImage.alt}
              width={activeImage.width}
              height={activeImage.height}
              className="h-full w-full object-cover motion-safe:animate-[crossfade_200ms_ease-out]"
              sizes="(max-width:1279px) 280px, 380px"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-noir via-noir/50 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-5 lg:p-6">
              <p className="font-[family-name:var(--font-playfair)] text-2xl leading-tight text-ivory lg:text-3xl">
                {category.headline}
              </p>
              <p className="mt-2 font-[family-name:var(--font-cormorant)] text-base italic text-ivory/70 lg:text-lg">
                {category.subline}
              </p>
              <Link
                href={category.cta.href}
                className="btn-ghost mt-5 inline-flex px-4 py-2.5 text-[0.65rem]"
                onClick={() => {
                  track({
                    name: "nav_cta_click",
                    category: category.id,
                    cta: category.cta.label,
                  });
                  onClose();
                }}
              >
                {category.cta.label}
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export function useFinePointer() {
  const [fine, setFine] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => setFine(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return fine;
}

export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return reduced;
}

export function useNavPanelController(finePointer: boolean) {
  const [openId, setOpenId] = useState<string | null>(null);
  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchArmed = useRef<string | null>(null);

  const clearTimers = () => {
    if (openTimer.current) clearTimeout(openTimer.current);
    if (closeTimer.current) clearTimeout(closeTimer.current);
  };

  const open = useCallback(
    (id: string, immediate = false) => {
      clearTimers();
      const run = () => {
        setOpenId(id);
        track({ name: "nav_open", category: id });
      };
      if (immediate || !finePointer) run();
      else openTimer.current = setTimeout(run, 120);
    },
    [finePointer]
  );

  const close = useCallback(
    (immediate = false) => {
      clearTimers();
      const run = () => {
        setOpenId(null);
        touchArmed.current = null;
      };
      if (immediate || !finePointer) run();
      else closeTimer.current = setTimeout(run, 200);
    },
    [finePointer]
  );

  const onTriggerActivate = useCallback(
    (id: string, href: string, e: React.MouseEvent | React.KeyboardEvent) => {
      if (finePointer) return;
      // Touch / coarse pointer: first tap opens, second tap navigates
      if (touchArmed.current === id && openId === id) {
        touchArmed.current = null;
        return; // allow navigation
      }
      e.preventDefault();
      touchArmed.current = id;
      if (openId && openId !== id) {
        setOpenId(id);
        track({ name: "nav_open", category: id });
      } else {
        open(id, true);
      }
    },
    [finePointer, open, openId]
  );

  useEffect(() => () => clearTimers(), []);

  return { openId, open, close, onTriggerActivate, setOpenId };
}

export function panelDomId(categoryId: string, base: string) {
  return `${base}-${categoryId}`;
}

export function useStableId(prefix: string) {
  return useId().replace(/:/g, "") + prefix;
}
