import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { formatKes } from "@/components/admin/formatKes";
import { format } from "date-fns";
import { OrderStatus } from "@prisma/client";
import { OrderStatusButtons } from "@/components/admin/OrderStatusButtons";

const TIMELINE: OrderStatus[] = [
  OrderStatus.NEW,
  OrderStatus.PAID,
  OrderStatus.PREPARING,
  OrderStatus.ALTERATION,
  OrderStatus.OUT_FOR_DELIVERY,
  OrderStatus.DELIVERED,
];

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await prisma.order.findFirst({
    where: { id, deletedAt: null },
    include: {
      customer: true,
      items: { where: { deletedAt: null } },
      payments: { where: { deletedAt: null } },
      shipments: { where: { deletedAt: null } },
      alterations: { where: { deletedAt: null } },
    },
  });
  if (!order) notFound();

  const currentIdx = TIMELINE.indexOf(order.status);

  return (
    <div>
      <PageHeader
        title={`Order #${order.number}`}
        subtitle={format(order.createdAt, "EEEE d MMMM yyyy · HH:mm")}
        actionHref="/admin/orders"
        actionLabel="Back to orders"
      />

      <div className="mb-8 flex flex-wrap gap-2">
        {TIMELINE.map((step, i) => {
          const done = currentIdx >= i && currentIdx !== -1;
          const current = order.status === step;
          return (
            <div
              key={step}
              className={`rounded-full border px-3 py-1 text-xs ${
                current
                  ? "border-gold bg-gold/15 text-gold"
                  : done
                    ? "border-emerald-500/30 text-emerald-300"
                    : "border-line text-ivory-faint"
              }`}
            >
              {step.replace(/_/g, " ")}
            </div>
          );
        })}
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <section className="space-y-4 lg:col-span-2">
          <div className="rounded-xl border border-line bg-noir-soft/40 p-6">
            <h2 className="mb-4 text-xs uppercase tracking-widest text-ivory-faint">
              Line items
            </h2>
            <ul className="divide-y divide-line/60">
              {order.items.map((item) => (
                <li key={item.id} className="flex justify-between py-3 text-sm">
                  <span className="text-ivory">
                    {item.name}
                    {item.size ? ` · ${item.size}` : ""}
                    {item.colour ? ` · ${item.colour}` : ""} × {item.qty}
                  </span>
                  <span>{formatKes(item.unitKes * item.qty)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-4 grid grid-cols-2 gap-2 border-t border-line pt-4 text-sm">
              <dt className="text-ivory-faint">Subtotal</dt>
              <dd className="text-right text-ivory">{formatKes(order.subtotalKes)}</dd>
              <dt className="text-ivory-faint">Delivery</dt>
              <dd className="text-right text-ivory">{formatKes(order.deliveryKes)}</dd>
              <dt className="font-medium text-ivory">Total</dt>
              <dd className="text-right font-medium text-ivory">
                {formatKes(order.totalKes)}
              </dd>
            </dl>
          </div>
          {order.alterations.length > 0 ? (
            <div className="rounded-xl border border-line bg-noir-soft/40 p-6">
              <h2 className="mb-3 text-xs uppercase tracking-widest text-ivory-faint">
                Alterations
              </h2>
              {order.alterations.map((a) => (
                <p key={a.id} className="text-sm text-ivory-muted">
                  {a.notes} — {a.status}
                </p>
              ))}
            </div>
          ) : null}
        </section>

        <aside className="space-y-4">
          <Panel title="Customer">
            {order.customer ? (
              <>
                <p className="text-ivory">
                  {order.customer.firstName} {order.customer.lastName}
                </p>
                <Link
                  href={`/admin/customers/${order.customer.id}`}
                  className="text-xs text-gold"
                >
                  View profile
                </Link>
              </>
            ) : (
              <p className="text-sm text-ivory-faint">Guest checkout</p>
            )}
          </Panel>
          <Panel title="Status">
            <StatusBadge status={order.status} />
            <p className="mt-2 text-xs text-ivory-faint">Channel: {order.channel}</p>
            <div className="mt-4">
              <OrderStatusButtons orderId={order.id} status={order.status} />
            </div>
          </Panel>
          {order.payments[0] ? (
            <Panel title="Payment">
              <p className="text-sm text-ivory">
                {order.payments[0].method} · {formatKes(order.payments[0].amountKes)}
              </p>
              <StatusBadge status={order.payments[0].status} />
            </Panel>
          ) : null}
          {order.internalNote ? (
            <Panel title="Internal note">
              <p className="text-sm text-ivory-muted">{order.internalNote}</p>
            </Panel>
          ) : null}
        </aside>
      </div>
    </div>
  );
}

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-line bg-noir-soft/40 p-4">
      <h3 className="mb-2 text-[11px] uppercase tracking-widest text-ivory-faint">
        {title}
      </h3>
      {children}
    </div>
  );
}
