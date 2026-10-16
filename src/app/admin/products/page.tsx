import Link from "next/link";
import { prisma } from "@/lib/db";
import { ProductStatus } from "@prisma/client";
import { PageHeader, TabRow } from "@/components/admin/PageHeader";
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

export const dynamic = "force-dynamic";

const LIVE: ProductStatus[] = [
  ProductStatus.PUBLISHED,
  ProductStatus.LOW_STOCK,
  ProductStatus.SOLD_OUT,
];

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status: raw } = await searchParams;
  const active = raw || "live";

  const [liveCount, inProgressCount, archivedCount, soldOutCount, lowStockCount, allCount] =
    await Promise.all([
      prisma.product.count({ where: { deletedAt: null, status: { in: LIVE } } }),
      prisma.product.count({ where: { deletedAt: null, status: ProductStatus.DRAFT } }),
      prisma.product.count({ where: { deletedAt: null, status: ProductStatus.ARCHIVED } }),
      prisma.product.count({ where: { deletedAt: null, status: ProductStatus.SOLD_OUT } }),
      prisma.product.count({ where: { deletedAt: null, status: ProductStatus.LOW_STOCK } }),
      prisma.product.count({ where: { deletedAt: null } }),
    ]);

  const where =
    active === "live"
      ? { deletedAt: null, status: { in: LIVE } }
      : active === "in-progress"
        ? { deletedAt: null, status: ProductStatus.DRAFT }
        : active === "all"
          ? { deletedAt: null }
          : {
              deletedAt: null,
              status: active.toUpperCase().replace("-", "_") as ProductStatus,
            };

  const products = await prisma.product.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    include: {
      category: true,
      variants: {
        where: { deletedAt: null },
        include: { stockLevels: { where: { deletedAt: null } } },
      },
    },
  });

  const tabs = [
    { key: "live", label: "Live", count: liveCount },
    { key: "all", label: "All", count: allCount },
    { key: "in-progress", label: "In progress", count: inProgressCount },
    { key: "LOW_STOCK", label: "Low stock", count: lowStockCount },
    { key: "SOLD_OUT", label: "Sold out", count: soldOutCount },
    { key: "ARCHIVED", label: "Archived", count: archivedCount },
  ];

  return (
    <div>
      <PageHeader
        title="Products"
        subtitle="Live catalogue shared with elijays-mens-wear.co.ke"
        actionHref="/admin/products/new"
        actionLabel="+ New product"
      />
      <TabRow tabs={tabs} active={active} baseHref="/admin/products" />
      <DataTable>
        <DataTableHead>
          <Th>Product</Th>
          <Th>SKU</Th>
          <Th>Category</Th>
          <Th>Status</Th>
          <Th>Price</Th>
          <Th>Stock</Th>
        </DataTableHead>
        <DataTableBody>
          {products.length === 0 ? (
            <EmptyRow colSpan={6} message="No products in this view." />
          ) : (
            products.map((p) => {
              const stock = p.variants.reduce(
                (sum, v) =>
                  sum + v.stockLevels.reduce((s, l) => s + l.quantity, 0),
                0,
              );
              return (
                <tr key={p.id}>
                  <Td>
                    <Link
                      href={`/admin/products/${p.id}`}
                      className="font-medium text-ivory hover:text-gold"
                    >
                      {p.name}
                    </Link>
                    {p.shortLine ? (
                      <p className="mt-0.5 text-xs text-ivory-faint">{p.shortLine}</p>
                    ) : null}
                  </Td>
                  <Td>{p.sku}</Td>
                  <Td>{p.category?.name ?? "—"}</Td>
                  <Td>
                    <StatusBadge
                      status={
                        p.status === ProductStatus.DRAFT ? "IN_PROGRESS" : p.status
                      }
                    />
                  </Td>
                  <Td>{formatKes(p.priceKes)}</Td>
                  <Td>{stock}</Td>
                </tr>
              );
            })
          )}
        </DataTableBody>
      </DataTable>
    </div>
  );
}
