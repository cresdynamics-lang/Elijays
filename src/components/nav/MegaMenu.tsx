"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { track } from "@/lib/analytics";
import type { NavCategory } from "@/lib/navigation";

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
  const listRef = useRef<HTMLDivElement>(null);

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

        <aside className="flex flex-col justify-between rounded-xl border border-[var(--line)] bg-gradient-to-br from-noir-elevated/90 via-noir-soft/50 to-noir p-7 lg:p-8">
          <div>
            <p className="text-[0.65rem] uppercase tracking-[0.28em] text-gold/70">
              {category.label}
            </p>
            <p className="font-[family-name:var(--font-playfair)] mt-4 text-2xl leading-tight text-ivory lg:text-3xl">
              {category.headline}
            </p>
            <p className="mt-3 font-[family-name:var(--font-cormorant)] text-base italic text-ivory/70 lg:text-lg">
              {category.subline}
            </p>
          </div>
          <Link
            href={category.cta.href}
            className="btn-gold mt-8 inline-flex w-fit px-4 py-2.5 text-[0.65rem]"
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
