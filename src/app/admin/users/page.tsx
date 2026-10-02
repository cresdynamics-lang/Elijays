import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/admin/PageHeader";
import { ROLE_LABELS } from "@/lib/auth/permissions";
import {
  DataTable,
  DataTableBody,
  DataTableHead,
  Td,
  Th,
} from "@/components/admin/DataTable";
import { format } from "date-fns";

export default async function UsersPage() {
  const users = await prisma.user.findMany({
    where: { deletedAt: null },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <PageHeader title="Users and Roles" subtitle="Team access · ELIJAYS admin" />
      <DataTable>
        <DataTableHead>
          <Th>Name</Th>
          <Th>Email</Th>
          <Th>Role</Th>
          <Th>Active</Th>
          <Th>Last sign in</Th>
        </DataTableHead>
        <DataTableBody>
          {users.map((u) => (
            <tr key={u.id}>
              <Td className="text-ivory">{u.name}</Td>
              <Td>{u.email}</Td>
              <Td>{ROLE_LABELS[u.role]}</Td>
              <Td>{u.active ? "Yes" : "No"}</Td>
              <Td>
                {u.lastSignInAt ? format(u.lastSignInAt, "d MMM yyyy") : "—"}
              </Td>
            </tr>
          ))}
        </DataTableBody>
      </DataTable>
    </div>
  );
}
