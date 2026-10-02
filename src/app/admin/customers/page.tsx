import Link from "next/link";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/admin/PageHeader";
import {
  DataTable,
  DataTableBody,
  DataTableHead,
  EmptyRow,
  Td,
  Th,
} from "@/components/admin/DataTable";

export default async function CustomersPage() {
  const customers = await prisma.customer.findMany({
    where: { deletedAt: null },
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { orders: true } } },
    take: 100,
  });

  return (
    <div>
      <PageHeader title="Customers" subtitle="Profiles · measurements · consent" />
      <DataTable>
        <DataTableHead>
          <Th>Name</Th>
          <Th>Email</Th>
          <Th>Phone</Th>
          <Th>Orders</Th>
          <Th>Tags</Th>
        </DataTableHead>
        <DataTableBody>
          {customers.length === 0 ? (
            <EmptyRow colSpan={5} message="No customers." />
          ) : (
            customers.map((c) => (
              <tr key={c.id} className="hover:bg-white/[0.02]">
                <Td className="text-ivory">
                  <Link href={`/admin/customers/${c.id}`} className="hover:text-gold">
                    {c.firstName} {c.lastName}
                  </Link>
                </Td>
                <Td>{c.email ?? "—"}</Td>
                <Td>{c.phone ?? "—"}</Td>
                <Td>{c._count.orders}</Td>
                <Td className="text-xs">{c.tags.join(", ") || "—"}</Td>
              </tr>
            ))
          )}
        </DataTableBody>
      </DataTable>
    </div>
  );
}
