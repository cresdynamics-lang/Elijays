import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/admin/PageHeader";
import { formatKes } from "@/components/admin/formatKes";
import {
  DataTable,
  DataTableBody,
  DataTableHead,
  Td,
  Th,
} from "@/components/admin/DataTable";
import { PrintReportButton } from "@/components/admin/PrintReportButton";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const [paidTotal, orderCount, abandoned, bestsellers, published] =
    await Promise.all([
      prisma.payment.aggregate({
        where: { deletedAt: null, status: "PAID" },
        _sum: { amountKes: true },
      }),
      prisma.order.count({
        where: { deletedAt: null, status: { not: "ABANDONED" } },
      }),
      prisma.order.count({ where: { deletedAt: null, status: "ABANDONED" } }),
      prisma.product.findMany({
        where: { deletedAt: null, isBestseller: true },
        take: 12,
        orderBy: { priceKes: "desc" },
      }),
      prisma.product.count({
        where: { deletedAt: null, status: "PUBLISHED" },
      }),
    ]);

  const generated = format(new Date(), "d MMMM yyyy · HH:mm");

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4 print:hidden">
        <PageHeader title="Reports" subtitle={`Generated ${generated}`} />
        <PrintReportButton />
      </div>

      <div className="report-print-root">
        <div className="mb-2 hidden print:block">
          <p className="font-display text-2xl">ELIJAYS Reports</p>
          <p className="text-sm text-neutral-600">{generated} · elijays.co.ke</p>
        </div>

        <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi label="Paid revenue" value={formatKes(paidTotal._sum.amountKes ?? 0)} />
          <Kpi label="Orders" value={String(orderCount)} />
          <Kpi label="Abandoned checkouts" value={String(abandoned)} />
          <Kpi label="Live products" value={String(published)} />
        </div>

        <h2 className="mb-4 font-display text-lg text-ivory print:text-black">
          Best sellers
        </h2>
        <DataTable>
          <DataTableHead>
            <Th>Product</Th>
            <Th>SKU</Th>
            <Th>Price</Th>
          </DataTableHead>
          <DataTableBody>
            {bestsellers.map((p) => (
              <tr key={p.id}>
                <Td className="text-ivory print:text-black">{p.name}</Td>
                <Td>{p.sku}</Td>
                <Td>{formatKes(p.priceKes)}</Td>
              </tr>
            ))}
          </DataTableBody>
        </DataTable>
        <p className="mt-6 text-sm text-ivory-faint print:text-neutral-600">
          Meta catalogue feed: https://elijays.co.ke/meta-feeds.csv
        </p>
      </div>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-noir-soft/40 p-6 print:border-neutral-300 print:bg-white">
      <p className="text-xs uppercase tracking-widest text-ivory-faint print:text-neutral-500">
        {label}
      </p>
      <p className="mt-2 font-display text-3xl text-ivory print:text-black">{value}</p>
    </div>
  );
}
