"use client";

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

export function AdminShell({ user, badges, children }: Props) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen flex-1 bg-[#0a0a0a] text-ivory">
      <aside className="flex w-60 shrink-0 flex-col border-r border-line bg-[#0a0a0a]">
        <div className="border-b border-line px-5 py-5">
          <Link href="/admin" className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-gold/50 bg-gold/10 font-display text-sm font-semibold text-gold">
              EJ
            </span>
            <span className="font-display text-lg tracking-[0.2em] text-ivory">
              ELIJAYS
            </span>
          </Link>
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
          <LogoutButton />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col bg-noir-soft/30">
        <header className="flex shrink-0 items-center gap-4 border-b border-line px-6 py-3">
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
        <main className="flex-1 overflow-y-auto px-6 py-8">{children}</main>
      </div>
    </div>
  );
}
