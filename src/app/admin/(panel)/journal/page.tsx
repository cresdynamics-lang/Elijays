import Link from "next/link";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/admin/PageHeader";
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

export default async function JournalPage() {
  const posts = await prisma.post.findMany({
    where: { deletedAt: null },
    orderBy: { updatedAt: "desc" },
    include: { author: true },
  });

  return (
    <div>
      <PageHeader
        title="Journal (Blog)"
        subtitle="Style notes · house stories"
        actionHref="/admin/journal/new"
        actionLabel="+ New post"
      />
      <DataTable>
        <DataTableHead>
          <Th>Title</Th>
          <Th>Status</Th>
          <Th>Author</Th>
          <Th>Views</Th>
          <Th>Updated</Th>
        </DataTableHead>
        <DataTableBody>
          {posts.length === 0 ? (
            <EmptyRow colSpan={5} message="No posts." />
          ) : (
            posts.map((p) => (
              <tr key={p.id}>
                <Td className="text-ivory">
                  <Link href={`/admin/journal/${p.id}`} className="hover:text-gold">
                    {p.title}
                  </Link>
                </Td>
                <Td>
                  <StatusBadge status={p.status} />
                </Td>
                <Td>{p.author?.name ?? "—"}</Td>
                <Td>{p.views}</Td>
                <Td>{format(p.updatedAt, "d MMM yyyy")}</Td>
              </tr>
            ))
          )}
        </DataTableBody>
      </DataTable>
    </div>
  );
}
