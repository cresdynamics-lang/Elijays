"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { SessionUser } from "@/lib/auth/session";
import { ROLE_LABELS, canAccess } from "@/lib/auth/permissions";
import type { NavBadges } from "@/lib/admin/badges";
import { ADMIN_NAV_GROUPS } from "@/components/admin/admin-nav";
import { cn } from "@/components/admin/cn";
import { LogoutButton } from "@/components/admin/LogoutButton";

type Props = {
  user: SessionUser;
  badges: NavBadges;
  children: React.ReactNode;
};

function MenuIcon({ open }: { open: boolean }) {
  return (
    <span className="relative block h-4 w-[18px]" aria-hidden>
      <span
        className={cn(
          "absolute left-0 block h-[1.5px] w-full bg-current transition-transform duration-200",
          open ? "top-1/2 -translate-y-1/2 rotate-45" : "top-0",
        )}
      />
      <span
        className={cn(
          "absolute left-0 top-1/2 block h-[1.5px] w-full -translate-y-1/2 bg-current transition-opacity duration-200",
          open ? "opacity-0" : "opacity-100",
        )}
      />
      <span
        className={cn(
          "absolute left-0 block h-[1.5px] w-full bg-current transition-transform duration-200",
          open ? "top-1/2 -translate-y-1/2 -rotate-45" : "bottom-0",
        )}
      />
    </span>
  );
}

export function AdminShell({ user, badges, children }: Props) {
  const pathname = usePathname();
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!navOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setNavOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [navOpen]);

  return (
    <div className="flex min-h-screen flex-1 bg-[#0a0a0a] text-ivory">
      {navOpen ? (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-black/70 lg:hidden"
          onClick={() => setNavOpen(false)}
        />
      ) : null}

      <aside
        id="admin-sidebar"
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 max-w-[85vw] flex-col border-r border-line bg-[#0a0a0a] transition-transform duration-200 lg:static lg:z-auto lg:w-60 lg:max-w-none lg:translate-x-0",
          navOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-5">
          <Link href="/admin" className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-gold/50 bg-gold/10 font-display text-sm font-semibold text-gold">
              EJ
            </span>
            <span className="font-display text-lg tracking-[0.2em] text-ivory">
              ELIJAYS
            </span>
          </Link>
          <button
            type="button"
            className="rounded-lg border border-line p-2 text-ivory lg:hidden"
            onClick={() => setNavOpen(false)}
            aria-label="Close menu"
          >
            <MenuIcon open />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {ADMIN_NAV_GROUPS.map((group) => {
            const items = group.items.filter((item) =>
              canAccess(user.role, item.module),
            );
            if (items.length === 0) return null;
            return (
              <div key={group.title} className="mb-6">
                <p className="mb-2 px-2 text-[10px] font-medium tracking-[0.2em] text-ivory-faint">
                  {group.title}
                </p>
                <ul className="space-y-0.5">
                  {items.map((item) => {
                    const active =
                      item.href === "/admin"
                        ? pathname === "/admin"
                        : pathname === item.href ||
                          pathname.startsWith(`${item.href}/`);
                    const badge =
                      item.badgeKey && badges[item.badgeKey] > 0
                        ? badges[item.badgeKey]
                        : null;
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className={cn(
                            "flex items-center justify-between rounded-lg px-2.5 py-2 text-[13px] transition",
                            active
                              ? "bg-gold/10 text-gold"
                              : "text-ivory-muted hover:bg-white/5 hover:text-ivory",
                          )}
                        >
                          <span>{item.label}</span>
                          {badge !== null ? (
                            <span className="min-w-[1.25rem] rounded-full bg-gold/20 px-1.5 py-0.5 text-center text-[10px] font-medium text-gold">
                              {badge}
                            </span>
                          ) : null}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </nav>
        <div className="border-t border-line px-4 py-3">
          <p className="mb-3 px-1 text-xs text-ivory-muted lg:hidden">
            <span className="text-ivory">{user.name}</span>{" "}
            <span className="text-ivory-faint">({ROLE_LABELS[user.role]})</span>
          </p>
          <LogoutButton />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col bg-noir-soft/30">
        <header className="flex shrink-0 items-center gap-3 border-b border-line px-4 py-3 sm:gap-4 sm:px-6">
          <button
            type="button"
            className="rounded-lg border border-line p-2 text-ivory lg:hidden"
            onClick={() => setNavOpen(true)}
            aria-label="Open menu"
            aria-controls="admin-sidebar"
            aria-expanded={navOpen}
          >
            <MenuIcon open={false} />
          </button>
          <div className="flex-1">
            <input
              type="search"
              placeholder="Search products, orders, customers, posts"
              className="w-full max-w-xl rounded-full border border-line bg-noir/60 px-4 py-2 text-sm text-ivory placeholder:text-ivory-faint focus:border-gold/40 focus:outline-none"
              readOnly
            />
          </div>
          <p className="hidden text-xs text-ivory-muted sm:block">
            Open now ·{" "}
            <span className="text-ivory">{user.name}</span>{" "}
            <span className="text-ivory-faint">({ROLE_LABELS[user.role]})</span>
          </p>
        </header>
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 sm:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
