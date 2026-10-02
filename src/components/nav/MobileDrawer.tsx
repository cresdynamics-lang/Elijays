"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { track } from "@/lib/analytics";
import { BRAND } from "@/lib/constants";
import {
  getEnabledCategories,
  getWhatsAppStylistUrl,
  navigationConfig,
} from "@/lib/navigation";
import { Logo } from "@/components/nav/Logo";

type Props = {
  open: boolean;
  onClose: () => void;
  onSearch: () => void;
  pageLabel: string;
  shopStatus: string;
};

export function MobileDrawer({
  open,
  onClose,
  onSearch,
  pageLabel,
  shopStatus,
}: Props) {
  const categories = getEnabledCategories();
  const secondary = navigationConfig.secondary;
  const [expanded, setExpanded] = useState<string | null>(null);
  const whatsappHref = getWhatsAppStylistUrl(pageLabel);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) setExpanded(null);
  }, [open]);

  return (
    <div
      className={`fixed inset-0 z-[60] transition-opacity duration-300 lg:hidden ${
        open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      <button
        type="button"
        className="absolute inset-0 bg-noir/80"
        aria-label="Close menu"
        onClick={onClose}
      />
      <aside
        className={`absolute left-0 top-0 flex h-full w-full flex-col bg-noir-soft border-r border-[var(--line)] transition-transform duration-500 md:w-[88%] ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Mobile navigation"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--line)]">
          <Logo size="sm" />
          <button
            type="button"
            onClick={onClose}
            className="font-[family-name:var(--font-jost)] text-[0.65rem] uppercase tracking-[0.2em] text-ivory/60"
          >
            Close
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-6">
          <ul className="space-y-1">
            {categories.map((cat) => {
              const isOpen = expanded === cat.id;
              return (
                <li key={cat.id} className="border-b border-[var(--line)]">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between py-4 text-left outline-none focus-visible:ring-2 focus-visible:ring-gold"
                    aria-expanded={isOpen}
                    onClick={() => {
                      setExpanded(isOpen ? null : cat.id);
                      if (!isOpen) track({ name: "nav_open", category: cat.id });
                    }}
                  >
                    <span className="font-[family-name:var(--font-playfair)] text-2xl text-ivory">
                      {cat.label}
                    </span>
                    <span className="text-gold text-sm">{isOpen ? "−" : "+"}</span>
                  </button>
                  {isOpen && (
                    <div className="pb-6">
                      <div className="relative mb-4 aspect-video overflow-hidden bg-noir-elevated">
                        <Image
                          src={cat.image.src}
                          alt={cat.image.alt}
                          width={cat.image.width}
                          height={Math.round(cat.image.width * (9 / 16))}
                          className="h-full w-full object-cover"
                          sizes="(max-width:768px) 100vw, 88vw"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-noir/70 to-transparent" />
                        <p className="absolute bottom-3 left-3 right-3 font-[family-name:var(--font-cormorant)] text-base italic text-ivory/85">
                          {cat.subline}
                        </p>
                      </div>
                      <ul className="space-y-3">
                        {cat.links.map((link) => (
                          <li key={link.href + link.label}>
                            <Link
                              href={link.href}
                              onClick={() => {
                                track({
                                  name: "nav_link_click",
                                  category: cat.id,
                                  sublink: link.label,
                                });
                                onClose();
                              }}
                              className="block"
                            >
                              <span className="font-[family-name:var(--font-jost)] text-[0.7rem] uppercase tracking-[0.16em] text-ivory">
                                {link.label}
                              </span>
                              <span className="mt-0.5 block text-xs text-ivory/45">
                                {link.descriptor}
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                      <Link
                        href={cat.cta.href}
                        onClick={() => {
                          track({
                            name: "nav_cta_click",
                            category: cat.id,
                            cta: cat.cta.label,
                          });
                          onClose();
                        }}
                        className="btn-ghost mt-5 inline-flex text-[0.65rem]"
                      >
                        {cat.cta.label}
                      </Link>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        <div className="border-t border-[var(--line)] px-5 py-5 space-y-4">
          <Link
            href={secondary.bespoke.href}
            onClick={onClose}
            className="block font-[family-name:var(--font-jost)] text-[0.7rem] uppercase tracking-[0.18em] text-gold"
          >
            {secondary.bespoke.label}
            <span className="mt-1 block font-[family-name:var(--font-cormorant)] text-sm italic normal-case tracking-normal text-ivory/55">
              {secondary.bespoke.lead}
            </span>
          </Link>
          <Link
            href={secondary.visit.href}
            onClick={onClose}
            className="flex items-center justify-between font-[family-name:var(--font-jost)] text-[0.7rem] uppercase tracking-[0.18em] text-ivory/80"
          >
            {secondary.visit.label}
            <span className="text-[0.55rem] text-gold/80">{shopStatus}</span>
          </Link>
          <a
            href={whatsappHref}
            target="_blank"
            rel="noreferrer"
            onClick={() => {
              track({ name: "whatsapp_click", page: pageLabel });
              onClose();
            }}
            className="flex w-full items-center justify-center bg-purple px-4 py-3.5 font-[family-name:var(--font-jost)] text-[0.7rem] uppercase tracking-[0.18em] text-ivory"
          >
            {secondary.whatsapp.label}
          </a>
          <p className="text-center text-[0.65rem] tracking-[0.12em] uppercase text-ivory/40">
            {BRAND.hours}
            <br />
            {BRAND.phone}
          </p>
          <button
            type="button"
            onClick={onSearch}
            className="w-full text-center font-[family-name:var(--font-jost)] text-[0.65rem] uppercase tracking-[0.18em] text-ivory/55"
          >
            {secondary.search.label}
          </button>
        </div>
      </aside>
    </div>
  );
}
