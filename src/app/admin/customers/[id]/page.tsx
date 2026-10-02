import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/admin/PageHeader";
import { formatKes } from "@/components/admin/formatKes";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const customer = await prisma.customer.findFirst({
    where: { id, deletedAt: null },
    include: {
      measurements: { where: { deletedAt: null }, orderBy: { takenAt: "desc" }, take: 1 },
      consents: { where: { deletedAt: null } },
      orders: {
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 5,
      },
      addresses: { where: { deletedAt: null } },
    },
  });
  if (!customer) notFound();

  const m = customer.measurements[0];

  return (
    <div>
      <PageHeader
        title={`${customer.firstName} ${customer.lastName}`}
        subtitle={customer.phone ?? customer.email ?? "No contact on file"}
        actionHref="/admin/customers"
        actionLabel="Back"
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-xl border border-line bg-noir-soft/40 p-6 lg:col-span-2">
          <h2 className="mb-4 text-xs uppercase tracking-widest text-ivory-faint">
            Measurements
          </h2>
          {m ? (
            <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <Cell label="Jacket" value={m.jacket} />
              <Cell label="Shirt" value={m.shirt} />
              <Cell label="Waist" value={m.waist} />
              <Cell label="Inseam" value={m.inseam} />
            </dl>
          ) : (
            <p className="text-sm text-ivory-faint">No measurements recorded.</p>
          )}

          <h2 className="mb-4 mt-8 text-xs uppercase tracking-widest text-ivory-faint">
            Consent
          </h2>
          <ul className="space-y-2 text-sm">
            {customer.consents.length === 0 ? (
              <li className="text-ivory-faint">No consent records.</li>
            ) : (
              customer.consents.map((c) => (
                <li key={c.id}>
                  {c.kind}: {c.granted ? "Granted" : "Declined"}
                  {c.source ? ` (${c.source})` : ""}
                </li>
              ))
            )}
          </ul>

          <h2 className="mb-4 mt-8 text-xs uppercase tracking-widest text-ivory-faint">
            Notes
          </h2>
          <p className="text-sm text-ivory-muted">{customer.notes ?? "—"}</p>
        </section>

        <aside className="space-y-6">
          <div className="rounded-xl border border-line bg-noir-soft/40 p-6">
            <h2 className="mb-4 text-xs uppercase tracking-widest text-ivory-faint">
              Actions
            </h2>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                disabled
                className="rounded-full border border-line px-4 py-2 text-xs text-ivory-muted"
              >
                Book fitting
              </button>
              <button
                type="button"
                disabled
                className="rounded-full border border-line px-4 py-2 text-xs text-ivory-muted"
              >
                WhatsApp
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-line bg-noir-soft/40 p-6">
            <h2 className="mb-3 text-xs uppercase tracking-widest text-ivory-faint">
              Recent orders
            </h2>
            <ul className="space-y-2 text-sm">
              {customer.orders.map((o) => (
                <li key={o.id}>
                  <Link href={`/admin/orders/${o.id}`} className="text-gold hover:underline">
                    #{o.number}
                  </Link>{" "}
                  — {formatKes(o.totalKes)}
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Cell({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-[11px] uppercase text-ivory-faint">{label}</dt>
      <dd className="text-ivory">{value ?? "—"}</dd>
    </div>
  );
}
