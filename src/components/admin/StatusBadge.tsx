import { cn } from "@/components/admin/cn";

const STYLES: Record<string, string> = {
  PUBLISHED: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  DRAFT: "bg-zinc-500/15 text-zinc-300 border-zinc-500/30",
  IN_PROGRESS: "bg-zinc-500/15 text-zinc-300 border-zinc-500/30",
  ARCHIVED: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  SOLD_OUT: "bg-red-500/15 text-red-300 border-red-500/30",
  LOW_STOCK: "bg-amber-500/15 text-amber-200 border-amber-500/30",
  NEW: "bg-sky-500/15 text-sky-200 border-sky-500/30",
  ABANDONED: "bg-orange-500/15 text-orange-200 border-orange-500/30",
  PAID: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  PREPARING: "bg-amber-500/15 text-amber-200 border-amber-500/30",
  ALTERATION: "bg-purple-500/15 text-purple-200 border-purple-500/30",
  OUT_FOR_DELIVERY: "bg-sky-500/15 text-sky-200 border-sky-500/30",
  DELIVERED: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  COLLECTED: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  CANCELLED: "bg-red-500/15 text-red-300 border-red-500/30",
  REFUNDED: "bg-zinc-500/15 text-zinc-300 border-zinc-500/30",
  PENDING: "bg-amber-500/15 text-amber-200 border-amber-500/30",
  APPROVED: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  HIDDEN: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
  SCHEDULED: "bg-sky-500/15 text-sky-200 border-sky-500/30",
  BIN: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  ACTIVE: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  CONFIRMED: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  REQUESTED: "bg-amber-500/15 text-amber-200 border-amber-500/30",
  COMPLETED: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
};

function labelize(value: string) {
  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function StatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const style = STYLES[status] ?? "bg-white/5 text-ivory-muted border-line";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium tracking-wide",
        style,
        className,
      )}
    >
      {labelize(status)}
    </span>
  );
}
