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
import { StatusBadge } from "@/components/admin/StatusBadge";
import { ProductThumb } from "@/components/admin/ProductThumb";

export const dynamic = "force-dynamic";

function shopQty(
  levels: { quantity: number; alertAt: number; location: { code: string } }[],
) {
  const shop = levels.find((l) => l.location.code === "SHOP") ?? levels[0];
  return { quantity: shop?.quantity ?? 0, alertAt: shop?.alertAt ?? 2 };
}

export default async function StockPage() {
  const variants = await prisma.productVariant.findMany({
    where: { deletedAt: null, product: { deletedAt: null } },
    include: {
      product: {
        include: {
          images: {
            where: { deletedAt: null },
            include: { media: true },
            orderBy: { sortOrder: "asc" },
          },
        },
      },
      stockLevels: {
        where: { deletedAt: null },
        include: { location: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  const rows = variants.map((v) => {
    const stock = shopQty(v.stockLevels);
    const images = v.product.images;
    // Display photo = first image, as on the storefront; a colour row prefers
    // that colour's own photo when one was uploaded.
    const photo = images[0]?.media.url ?? null;
    const colourPhoto =
      images.find((img) => v.colour && img.colour === v.colour)?.media.url ?? photo;
    return {
      id: v.id,
      productId: v.productId,
      name: v.product.name,
      photo,
      colourPhoto,
      sku: v.sku,
      colour: v.colour ?? "—",
      size: v.size ?? "—",
      quantity: stock.quantity,
      alertAt: stock.alertAt,
      low: stock.quantity <= stock.alertAt,
      status: v.product.status,
    };
  });

  const low = rows.filter((r) => r.low);
  const products = new Map<
    string,
    {
      id: string;
      name: string;
      photo: string | null;
      units: number;
      low: number;
      status: string;
    }
  >();
  for (const row of rows) {
    const current = products.get(row.productId) ?? {
      id: row.productId,
      name: row.name,
      photo: row.photo,
      units: 0,
      low: 0,
      status: row.status,
    };
    current.units += row.quantity;
    if (row.low) current.low += 1;
    products.set(row.productId, current);
  }

  return (
    <div>
      <PageHeader
        title="Stock"
        subtitle="Low-stock alerts and units by colour and size. Update a product to change quantities."
      />

      <h2 className="mb-3 font-display text-lg text-ivory">Low stock</h2>
      <DataTable className="mb-10">
        <DataTableHead>
          <Th>Product</Th>
          <Th>Colour</Th>
          <Th>Size</Th>
          <Th>Qty</Th>
          <Th>Alert at</Th>
          <Th></Th>
        </DataTableHead>
        <DataTableBody>
          {low.length === 0 ? (
            <EmptyRow colSpan={6} message="Nothing below the alert number." />
          ) : (
            low.map((row) => (
              <tr key={row.id}>
                <Td className="text-ivory">
                  <div className="flex items-center gap-3">
                    <ProductThumb
                      href={`/admin/products/${row.productId}#stock`}
                      src={row.colourPhoto}
                    />
                    <span>{row.name}</span>
                  </div>
                </Td>
                <Td>{row.colour}</Td>
                <Td>{row.size}</Td>
                <Td className="text-amber-200">{row.quantity}</Td>
                <Td>{row.alertAt}</Td>
                <Td>
                  <Link
                    href={`/admin/products/${row.productId}#stock`}
                    className="text-xs uppercase tracking-widest text-gold hover:underline"
                  >
                    Update stock →
                  </Link>
                </Td>
              </tr>
            ))
          )}
        </DataTableBody>
      </DataTable>

      <h2 className="mb-3 font-display text-lg text-ivory">All products</h2>
      <DataTable>
        <DataTableHead>
          <Th>Product</Th>
          <Th>Units</Th>
          <Th>Low sizes</Th>
          <Th>Status</Th>
          <Th></Th>
        </DataTableHead>
        <DataTableBody>
          {products.size === 0 ? (
            <EmptyRow colSpan={5} message="No stock records yet." />
          ) : (
            Array.from(products.values()).map((p) => (
              <tr key={p.id}>
                <Td className="text-ivory">
                  <div className="flex items-center gap-3">
                    <ProductThumb
                      href={`/admin/products/${p.id}#stock`}
                      src={p.photo}
                    />
                    <span>{p.name}</span>
                  </div>
                </Td>
                <Td>{p.units}</Td>
                <Td className={p.low > 0 ? "text-amber-200" : ""}>
                  {p.low > 0 ? p.low : "—"}
                </Td>
                <Td>
                  <StatusBadge status={p.status} />
                </Td>
                <Td>
                  <Link
                    href={`/admin/products/${p.id}#stock`}
                    className="text-xs uppercase tracking-widest text-gold hover:underline"
                  >
                    Edit product →
                  </Link>
                </Td>
              </tr>
            ))
          )}
        </DataTableBody>
      </DataTable>
    </div>
  );
}
