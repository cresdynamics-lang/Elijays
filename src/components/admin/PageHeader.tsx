import Link from "next/link";
import { cn } from "@/components/admin/cn";

export function PageHeader({
  title,
  subtitle,
  action,
  actionHref,
  actionLabel,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  actionHref?: string;
  actionLabel?: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="mb-8 flex flex-col gap-4 border-b border-line pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-2xl font-medium tracking-tight text-ivory md:text-3xl">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-1 text-sm text-ivory-muted">{subtitle}</p>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {children}
        {action}
        {actionHref && actionLabel ? (
          <Link
            href={actionHref}
            className="rounded-full border border-gold/40 bg-gold/10 px-4 py-2 text-xs font-medium uppercase tracking-widest text-gold transition hover:bg-gold/20"
          >
            {actionLabel}
          </Link>
        ) : null}
      </div>
    </header>
  );
}

export function TabRow({
  tabs,
  active,
  baseHref,
}: {
  tabs: { key: string; label: string; count?: number }[];
  active: string;
  baseHref: string;
}) {
  return (
    <div className="mb-6 flex flex-wrap gap-2 border-b border-line pb-3">
      {tabs.map((tab) => {
        const href =
          tab.key === "all"
            ? baseHref
            : `${baseHref}?status=${encodeURIComponent(tab.key)}`;
        const isActive = active === tab.key;
        return (
          <Link
            key={tab.key}
            href={href}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs tracking-wide transition",
              isActive
                ? "bg-gold/15 text-gold border border-gold/35"
                : "text-ivory-muted hover:text-ivory border border-transparent",
            )}
          >
            {tab.label}
            {tab.count !== undefined ? (
              <span className="ml-1.5 opacity-70">({tab.count})</span>
            ) : null}
          </Link>
        );
      })}
    </div>
  );
}
