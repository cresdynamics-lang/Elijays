import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { startOfWeek, endOfWeek, format } from "date-fns";

export default async function BespokePage() {
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

  const [appointments, requests, fabricCount] = await Promise.all([
    prisma.appointment.findMany({
      where: {
        deletedAt: null,
        startsAt: { gte: weekStart, lte: weekEnd },
      },
      orderBy: { startsAt: "asc" },
      include: { customer: true },
    }),
    prisma.bespokeRequest.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { customer: true },
    }),
    prisma.fabricSwatch.count({ where: { deletedAt: null, inLibrary: true } }),
  ]);

  return (
    <div>
      <PageHeader
        title="Bespoke and Fittings"
        subtitle={`Week of ${format(weekStart, "d MMM")} — fabric library: ${fabricCount} swatches`}
      />

      <h2 className="mb-4 font-display text-lg text-ivory">This week</h2>
      <ul className="mb-10 space-y-3 rounded-xl border border-line bg-noir-soft/40 p-4">
        {appointments.length === 0 ? (
          <li className="text-sm text-ivory-faint">No appointments this week.</li>
        ) : (
          appointments.map((a) => (
            <li key={a.id} className="flex justify-between text-sm">
              <span className="text-ivory">
                {format(a.startsAt, "EEE d MMM · HH:mm")} — {a.title}
              </span>
              <StatusBadge status={a.status} />
            </li>
          ))
        )}
      </ul>

      <h2 className="mb-4 font-display text-lg text-ivory">New requests</h2>
      <ul className="space-y-3 rounded-xl border border-line bg-noir-soft/40 p-4">
        {requests.map((r) => (
          <li key={r.id} className="border-b border-line/40 pb-3 last:border-0">
            <div className="flex justify-between gap-4">
              <p className="text-ivory">{r.summary}</p>
              <StatusBadge status={r.status} />
            </div>
            {r.customer ? (
              <p className="mt-1 text-xs text-ivory-faint">
                {r.customer.firstName} {r.customer.lastName}
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
