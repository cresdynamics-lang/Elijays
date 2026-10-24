import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/admin/PageHeader";
import {
  DataTable,
  DataTableBody,
  DataTableHead,
  Td,
  Th,
} from "@/components/admin/DataTable";
import { format } from "date-fns";

export default async function AuditPage() {
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { actor: true },
  });

  return (
    <div>
      <PageHeader title="Audit Log" subtitle="Who changed what · last 100 events" />
      <DataTable>
        <DataTableHead>
          <Th>When</Th>
          <Th>Actor</Th>
          <Th>Action</Th>
          <Th>Entity</Th>
          <Th>Label</Th>
        </DataTableHead>
        <DataTableBody>
          {logs.map((log) => (
            <tr key={log.id}>
              <Td>{format(log.createdAt, "d MMM yyyy HH:mm")}</Td>
              <Td className="text-ivory">{log.actor?.name ?? "System"}</Td>
              <Td>{log.action}</Td>
              <Td>
                {log.entityType}
                {log.entityId ? ` · ${log.entityId.slice(0, 8)}…` : ""}
              </Td>
              <Td>{log.entityLabel ?? "—"}</Td>
            </tr>
          ))}
        </DataTableBody>
      </DataTable>
    </div>
  );
}
