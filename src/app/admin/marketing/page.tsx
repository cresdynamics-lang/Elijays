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

export default async function MarketingPage() {
  const [codes, announcements, giftCards, privateCount] = await Promise.all([
    prisma.discountCode.findMany({ where: { deletedAt: null } }),
    prisma.announcement.findMany({
      where: { deletedAt: null },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.giftCard.findMany({ where: { deletedAt: null }, take: 10 }),
    prisma.privateListEntry.count({ where: { deletedAt: null } }),
  ]);

  return (
    <div>
      <PageHeader
        title="Marketing"
        subtitle={`Private list · ${privateCount} subscribers`}
      />

      <h2 className="mb-3 font-display text-lg text-ivory">Discount codes</h2>
      <DataTable className="mb-10">
        <DataTableHead>
          <Th>Code</Th>
          <Th>Offer</Th>
          <Th>Used</Th>
          <Th>Status</Th>
        </DataTableHead>
        <DataTableBody>
          {codes.map((c) => (
            <tr key={c.id}>
              <Td className="text-ivory">{c.code}</Td>
              <Td>{c.offer}</Td>
              <Td>{c.usedCount}</Td>
              <Td>{c.status}</Td>
            </tr>
          ))}
        </DataTableBody>
      </DataTable>

      <h2 className="mb-3 font-display text-lg text-ivory">Announcements</h2>
      <ul className="mb-10 space-y-2 rounded-xl border border-line bg-noir-soft/40 p-4 text-sm">
        {announcements.map((a) => (
          <li key={a.id} className="flex justify-between">
            <span className="text-ivory">{a.message}</span>
            <span className="text-ivory-faint">{a.enabled ? "ON" : "OFF"}</span>
          </li>
        ))}
      </ul>

      <h2 className="mb-3 font-display text-lg text-ivory">Gift cards</h2>
      <DataTable>
        <DataTableHead>
          <Th>Code</Th>
          <Th>Balance</Th>
          <Th>Status</Th>
        </DataTableHead>
        <DataTableBody>
          {giftCards.map((g) => (
            <tr key={g.id}>
              <Td className="text-ivory">{g.code}</Td>
              <Td>{formatKes(g.balanceKes)}</Td>
              <Td>{g.status}</Td>
            </tr>
          ))}
        </DataTableBody>
      </DataTable>
    </div>
  );
}
