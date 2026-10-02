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

export default async function InventoryPage() {
  const oxford = await prisma.product.findFirst({
    where: { slug: "ivory-oxford-button-down", deletedAt: null },
    include: {
      variants: {
        where: { deletedAt: null },
        include: {
          stockLevels: {
            where: { deletedAt: null },
            include: { location: true },
          },
        },
      },
    },
  });

  const lowAlerts = await prisma.stockLevel.findMany({
    where: { deletedAt: null },
    include: {
      variant: { include: { product: true } },
      location: true,
    },
  });
  const low = lowAlerts.filter((s) => s.quantity <= s.alertAt);

  const movements = await prisma.stockMovement.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    take: 8,
    include: {
      variant: { include: { product: true } },
      fromLocation: true,
      toLocation: true,
    },
  });

  return (
    <div>
      <PageHeader
        title="Inventory"
        subtitle="Shop floor · website · movements"
      />

      {oxford ? (
        <>
          <h2 className="mb-3 font-display text-lg text-ivory">
            {oxford.name} — variants
          </h2>
          <DataTable className="mb-10">
            <DataTableHead>
              <Th>Variant</Th>
              <Th>Location</Th>
              <Th>Qty</Th>
              <Th>Reserved</Th>
              <Th>Alert at</Th>
            </DataTableHead>
            <DataTableBody>
              {oxford.variants.flatMap((v) =>
                v.stockLevels.map((sl) => (
                  <tr key={sl.id}>
                    <Td className="text-ivory">
                      {v.colour} / {v.size}
                    </Td>
                    <Td>{sl.location.name}</Td>
                    <Td className={sl.quantity <= sl.alertAt ? "text-amber-200" : ""}>
                      {sl.quantity}
                    </Td>
                    <Td>{sl.reserved}</Td>
                    <Td>{sl.alertAt}</Td>
                  </tr>
                )),
              )}
            </DataTableBody>
          </DataTable>
        </>
      ) : null}

      <h2 className="mb-3 font-display text-lg text-ivory">Low stock alerts</h2>
      <ul className="mb-10 space-y-2 rounded-xl border border-line bg-noir-soft/40 p-4">
        {low.length === 0 ? (
          <li className="text-sm text-ivory-faint">No alerts.</li>
        ) : (
          low.map((s) => (
            <li key={s.id} className="text-sm text-ivory-muted">
              {s.variant.product.name} ({s.variant.colour}/{s.variant.size}) —{" "}
              {s.quantity} at {s.location.name}
            </li>
          ))
        )}
      </ul>

      <h2 className="mb-3 font-display text-lg text-ivory">Recent movements</h2>
      <DataTable>
        <DataTableHead>
          <Th>When</Th>
          <Th>Product</Th>
          <Th>Type</Th>
          <Th>Qty</Th>
          <Th>Reference</Th>
        </DataTableHead>
        <DataTableBody>
          {movements.map((m) => (
            <tr key={m.id}>
              <Td>{format(m.createdAt, "d MMM HH:mm")}</Td>
              <Td className="text-ivory">{m.variant.product.name}</Td>
              <Td>{m.type}</Td>
              <Td>{m.quantity}</Td>
              <Td>{m.reference ?? "—"}</Td>
            </tr>
          ))}
        </DataTableBody>
      </DataTable>
    </div>
  );
}
