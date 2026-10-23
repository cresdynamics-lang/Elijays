import Link from "next/link";
import { OrderChannel } from "@prisma/client";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/admin/PageHeader";
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
import { PaymentDesk } from "./PaymentDesk";
import { SITE_URL } from "@/lib/constants";

export default async function PaymentsPage() {
  const requests = await prisma.order.findMany({
    where: { deletedAt: null, channel: OrderChannel.SHOP },
    orderBy: { createdAt: "desc" },
    take: 40,
    include: {
      payments: { where: { deletedAt: null }, orderBy: { createdAt: "desc" } },
    },
  });

  return (
    <div>
      <PageHeader
        title="Payments"
        subtitle="Prompt M-Pesa in store, or send a link to settle."
      />
      <PaymentDesk />

      <h2 className="mb-4 mt-10 text-xs uppercase tracking-widest text-ivory-faint">
        Recent requests
      </h2>
      <DataTable>
        <DataTableHead>
          <Th>Order</Th>
          <Th>Customer</Th>
          <Th>Kind</Th>
          <Th>Amount</Th>
          <Th>Status</Th>
          <Th>When</Th>
        </DataTableHead>
        <DataTableBody>
          {requests.length === 0 ? (
            <EmptyRow colSpan={6} message="No in-store or link payments yet." />
          ) : (
            requests.map((order) => {
              const desk =
                order.addressJson &&
                typeof order.addressJson === "object" &&
                "desk" in order.addressJson
                  ? String((order.addressJson as { desk?: string }).desk)
                  : "";
              const payment = order.payments[0];
              const kind = desk === "link" ? "Link" : "In store";
              return (
                <tr key={order.id} className="hover:bg-white/[0.02]">
                  <Td className="text-ivory">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="hover:text-gold"
                    >
                      #{order.number}
                    </Link>
                  </Td>
                  <Td>
                    {order.guestName || "Walk-in"}
                    {order.guestPhone ? (
                      <span className="block text-xs text-ivory-faint">
                        {order.guestPhone}
                      </span>
                    ) : null}
                  </Td>
                  <Td>
                    {kind}
                    {desk === "link" && order.checkoutToken ? (
                      <a
                        href={`${SITE_URL}/pay/${order.checkoutToken}`}
                        className="mt-1 block text-xs text-gold hover:underline"
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open link
                      </a>
                    ) : null}
                  </Td>
                  <Td className="text-ivory">{formatKes(order.totalKes)}</Td>
                  <Td>
                    <StatusBadge status={payment?.status || order.status} />
                    {payment?.mpesaReceipt ? (
                      <span className="mt-1 block text-xs text-ivory-faint">
                        {payment.mpesaReceipt}
                      </span>
                    ) : null}
                  </Td>
                  <Td>{format(order.createdAt, "d MMM · HH:mm")}</Td>
                </tr>
              );
            })
          )}
        </DataTableBody>
      </DataTable>
    </div>
  );
}
