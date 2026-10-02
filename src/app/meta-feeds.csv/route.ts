import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ProductStatus } from "@prisma/client";

const SITE = "https://elijays.co.ke";

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Meta Commerce catalogue feed — all updated/published products.
 * https://elijays.co.ke/meta-feeds.csv
 */
export async function GET() {
  const products = await prisma.product.findMany({
    where: {
      deletedAt: null,
      status: {
        in: [ProductStatus.PUBLISHED, ProductStatus.LOW_STOCK, ProductStatus.SOLD_OUT],
      },
    },
    orderBy: { updatedAt: "desc" },
    include: {
      images: {
        where: { deletedAt: null },
        include: { media: true },
        orderBy: { sortOrder: "asc" },
        take: 1,
      },
      category: true,
      variants: {
        where: { deletedAt: null },
        include: {
          stockLevels: { where: { deletedAt: null } },
        },
      },
    },
  });

  const header = [
    "id",
    "title",
    "description",
    "availability",
    "condition",
    "price",
    "link",
    "image_link",
    "brand",
    "google_product_category",
    "product_type",
    "updated_time",
  ].join(",");

  const rows = products.map((p) => {
    const qty = p.variants.reduce(
      (sum, v) => sum + v.stockLevels.reduce((s, l) => s + l.quantity, 0),
      0,
    );
    const availability =
      p.status === ProductStatus.SOLD_OUT || qty <= 0 ? "out of stock" : "in stock";
    const image =
      p.images[0]?.media.url ??
      `${SITE}/hero/hero-model.webp`;
    const imageLink = image.startsWith("http") ? image : `${SITE}${image}`;
    const desc = (p.description || p.shortLine || p.name).replace(/\s+/g, " ").trim();

    return [
      p.sku || p.slug,
      csvEscape(p.name),
      csvEscape(desc.slice(0, 5000)),
      availability,
      "new",
      `${p.priceKes} KES`,
      `${SITE}/product/${p.slug}`,
      imageLink,
      "ELIJAYS",
      "Apparel & Accessories > Clothing",
      csvEscape(p.category?.name ?? "Men"),
      p.updatedAt.toISOString(),
    ].join(",");
  });

  const body = [header, ...rows].join("\n");

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      "Content-Disposition": 'inline; filename="meta-feeds.csv"',
    },
  });
}
