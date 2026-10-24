import Link from "next/link";
import { prisma } from "@/lib/db";
import { OrderStatus } from "@prisma/client";
import { PageHeader, TabRow } from "@/components/admin/PageHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { formatKes } from "@/components/admin/formatKes";
import {
  DataTable,
  DataTableBody,
  DataTableHead,
  EmptyRow,
  Td,
  Th,
} from "@/components/admin/DataTable";
import { format } from "date-fns";

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; selected?: string }>;
}) {
  const { status: raw, selected: selectedId } = await searchParams;
  const statuses = Object.values(OrderStatus);
  const active =
    raw && statuses.includes(raw as OrderStatus) ? raw : "all";

  const counts = await Promise.all(
    statuses.map(async (s) => ({
      key: s,
      count: await prisma.order.count({ where: { deletedAt: null, status: s } }),
    })),
  );
  const allCount = await prisma.order.count({ where: { deletedAt: null } });

  const orders = await prisma.order.findMany({
    where: {
      deletedAt: null,
      ...(active !== "all" ? { status: active as OrderStatus } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: { customer: true },
    take: 50,
  });

  const selected =
    (selectedId
      ? await prisma.order.findFirst({
          where: { id: selectedId, deletedAt: null },
          include: {
            customer: true,
            items: { where: { deletedAt: null } },
            payments: { where: { deletedAt: null } },
          },
        })
      : null) ??
    (await prisma.order.findFirst({
      where: { deletedAt: null, number: 1042 },
      include: {
        customer: true,
        items: { where: { deletedAt: null } },
        payments: { where: { deletedAt: null } },
      },
    })) ??
    orders[0]
      ? await prisma.order.findFirst({
          where: { id: orders[0].id, deletedAt: null },
          include: {
            customer: true,
            items: { where: { deletedAt: null } },
            payments: { where: { deletedAt: null } },
          },
        })
      : null;

  const tabs = [
    { key: "all", label: "All", count: allCount },
    ...counts.map((c) => ({
      key: c.key,
      label: c.key.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (x) => x.toUpperCase()),
      count: c.count,
    })),
  ];

  const statusQuery = active !== "all" ? `&status=${active}` : "";

  return (
    <div>
      <PageHeader title="Orders" subtitle="Website · shop · WhatsApp" />
      <TabRow tabs={tabs} active={active} baseHref="/admin/orders" />
      <div className="grid gap-6 xl:grid-cols-5">
        <div className="xl:col-span-3">
          <DataTable>
            <DataTableHead>
              <Th>Order</Th>
              <Th>Customer</Th>
              <Th>Status</Th>
              <Th>Total</Th>
              <Th>Date</Th>
            </DataTableHead>
            <DataTableBody>
              {orders.length === 0 ? (
                <EmptyRow colSpan={5} message="No orders." />
              ) : (
                orders.map((o) => (
                  <tr
                    key={o.id}
                    className={
                      selected?.id === o.id ? "bg-gold/5" : "hover:bg-white/[0.02]"
                    }
                  >
                    <Td className="text-ivory">
                      <Link
                        href={`/admin/orders?selected=${o.id}${statusQuery}`}
                        className="hover:text-gold"
                      >
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
                    <Td>{format(o.createdAt, "d MMM yyyy")}</Td>
                  </tr>
                ))
              )}
            </DataTableBody>
          </DataTable>
        </div>

        {selected ? (
          <aside className="xl:col-span-2 rounded-xl border border-line bg-noir-soft/50 p-6">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 className="font-display text-xl text-ivory">#{selected.number}</h2>
                <StatusBadge status={selected.status} />
              </div>
              <Link
                href={`/admin/orders/${selected.id}`}
                className="text-xs text-gold hover:underline"
              >
                Full detail →
              </Link>
            </div>
            <p className="text-sm text-ivory-muted">
              {selected.customer
                ? `${selected.customer.firstName} ${selected.customer.lastName}`
                : "Guest"}{" "}
              · {selected.channel}
            </p>
            <ul className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
              {selected.items.map((item) => (
                <li key={item.id} className="flex justify-between">
                  <span>
                    {item.name} × {item.qty}
                  </span>
                  <span className="text-ivory">{formatKes(item.unitKes * item.qty)}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 border-t border-line pt-3 font-medium text-ivory">
              Total {formatKes(selected.totalKes)}
            </p>
            {selected.payments[0] ? (
              <p className="mt-2 text-xs text-ivory-faint">
                Payment: {selected.payments[0].method} · {selected.payments[0].status}
              </p>
            ) : null}
          </aside>
        ) : null}
      </div>
    </div>
  );
}
