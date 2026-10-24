import Link from "next/link";
import { getSessionUser } from "@/lib/auth/session";
import { getDashboardData } from "@/lib/admin/dashboard";
import { PageHeader } from "@/components/admin/PageHeader";
import { formatKes } from "@/components/admin/formatKes";
import { StatusBadge } from "@/components/admin/StatusBadge";
import {
  DataTable,
  DataTableBody,
  DataTableHead,
  EmptyRow,
  Td,
  Th,
} from "@/components/admin/DataTable";
import { format } from "date-fns";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminDashboardPage() {
  const user = await getSessionUser();
  const data = await getDashboardData(user?.name ?? "there");
  const greeting = `Good morning, ${data.userName}`;

  const kpis = [
    { label: "Sales today", value: formatKes(data.salesTodayKes) },
    { label: "Orders waiting", value: String(data.ordersWaiting) },
    { label: "Low stock", value: String(data.lowStock) },
    { label: "Abandoned", value: String(data.abandonedLeads) },
  ];

  return (
    <div>
      <PageHeader
        title={greeting}
        subtitle={`${format(new Date(), "EEEE")} overview · live from Postgres`}
        actionHref="/admin/products/new"
        actionLabel="+ New product"
      />

      <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => {
          const href = k.label === "Low stock" ? "/admin/stock" : null;
          const inner = (
            <>
              <p className="text-[11px] uppercase tracking-widest text-ivory-faint">
                {k.label}
              </p>
              <p className="mt-2 font-display text-2xl text-ivory">{k.value}</p>
            </>
          );
          return href ? (
            <Link
              key={k.label}
              href={href}
              className="rounded-xl border border-line bg-noir-soft/50 px-4 py-5 transition hover:border-gold/30"
            >
              {inner}
            </Link>
          ) : (
            <div
              key={k.label}
              className="rounded-xl border border-line bg-noir-soft/50 px-4 py-5"
            >
              {inner}
            </div>
          );
        })}
      </div>

      <div className="grid gap-8 xl:grid-cols-3">
        <section className="xl:col-span-2">
          <h2 className="mb-4 font-display text-lg text-ivory">Orders to action</h2>
          <DataTable>
            <DataTableHead>
              <Th>Order</Th>
              <Th>Customer</Th>
              <Th>Status</Th>
              <Th>Total</Th>
              <Th>Placed</Th>
            </DataTableHead>
            <DataTableBody>
              {data.ordersToAction.length === 0 ? (
                <EmptyRow colSpan={5} message="No orders waiting right now." />
              ) : (
                data.ordersToAction.map((o) => (
                  <tr key={o.id} className="hover:bg-white/[0.02]">
                    <Td className="text-ivory">
                      <Link href={`/admin/orders/${o.id}`} className="hover:text-gold">
                        #{o.number}
                      </Link>
                    </Td>
                    <Td>
                      {o.customer
                        ? `${o.customer.firstName} ${o.customer.lastName}`
                        : "Guest"}
                    </Td>
                    <Td>
                      <StatusBadge status={o.status} />
                    </Td>
                    <Td className="text-ivory">{formatKes(o.totalKes)}</Td>
                    <Td>{format(o.createdAt, "d MMM, HH:mm")}</Td>
                  </tr>
                ))
              )}
            </DataTableBody>
          </DataTable>
        </section>

        <section>
          <h2 className="mb-4 font-display text-lg text-ivory">Needs attention</h2>
          <ul className="space-y-2 rounded-xl border border-line bg-noir-soft/40 p-4">
            {data.attention.length === 0 ? (
              <li className="text-sm text-ivory-faint">All clear for now.</li>
            ) : (
              data.attention.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="text-sm text-ivory-muted hover:text-gold"
                  >
                    {item.label}
                  </Link>
                </li>
              ))
            )}
          </ul>

        </section>
      </div>

      <section className="mt-10">
        <h2 className="mb-4 font-display text-lg text-ivory">Best sellers</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.bestsellers.map((p) => (
            <Link
              key={p.id}
              href={`/admin/products/${p.id}`}
              className="rounded-xl border border-line bg-noir-soft/40 p-4 transition hover:border-gold/30"
            >
              <p className="font-medium text-ivory">{p.name}</p>
              <p className="text-sm text-ivory-muted">{formatKes(p.priceKes)}</p>
            </Link>
          ))}
          <div className="rounded-xl border border-dashed border-line p-4 text-sm text-ivory-faint">
            Traffic &amp; conversion — connect analytics in Settings.
          </div>
        </div>
      </section>
    </div>
  );
}
