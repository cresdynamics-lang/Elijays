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

export default async function CollectionsPage() {
  const collections = await prisma.collection.findMany({
    where: { deletedAt: null },
    orderBy: { name: "asc" },
    include: { _count: { select: { products: true } } },
  });

  return (
    <div>
      <PageHeader title="Collections" subtitle="Curated product groups" />
      <DataTable>
        <DataTableHead>
          <Th>Name</Th>
          <Th>Slug</Th>
          <Th>Products</Th>
        </DataTableHead>
        <DataTableBody>
          {collections.length === 0 ? (
            <EmptyRow colSpan={3} message="No collections." />
          ) : (
            collections.map((c) => (
              <tr key={c.id}>
                <Td className="text-ivory">{c.name}</Td>
                <Td>{c.slug}</Td>
                <Td>{c._count.products}</Td>
              </tr>
            ))
          )}
        </DataTableBody>
      </DataTable>
    </div>
  );
}
