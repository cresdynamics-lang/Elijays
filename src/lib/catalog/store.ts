import { cache } from "react";
import { ProductStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  createCatalog,
  fileProducts,
  type Category,
  type Product,
} from "@/lib/products";

// Statuses the storefront lists. Drafts and archived products stay hidden.
const LIVE_STATUSES: ProductStatus[] = [
  ProductStatus.PUBLISHED,
  ProductStatus.LOW_STOCK,
  ProductStatus.SOLD_OUT,
];

// Database category slug -> storefront category, for products created in the
// admin that have no entry in the product file.
const CATEGORY_FROM_DB: Record<string, Category> = {
  suits: "suits",
  outerwear: "jackets",
  knitwear: "sweaters",
  shirts: "shirts",
  trousers: "trousers",
  jeans: "jeans",
};

function storefrontCategory(dbSlug: string | undefined, name: string): Category {
  if (dbSlug && CATEGORY_FROM_DB[dbSlug]) return CATEGORY_FROM_DB[dbSlug];
  // Accessories are one category in the database but three on the site.
  if (/\btie/i.test(name)) return "ties";
  if (/\bsock/i.test(name)) return "socks";
  return "belts";
}

function unique(values: (string | null | undefined)[]) {
  return [...new Set(values.filter((v): v is string => !!v && !!v.trim()))];
}

const fileBySlug = new Map(fileProducts.map((p) => [p.slug, p]));
const fileOrder = new Map(fileProducts.map((p, i) => [p.slug, i]));

async function loadFromDb(): Promise<Product[] | null> {
  try {
    const [rows, total] = await Promise.all([
      prisma.product.findMany({
        where: { deletedAt: null, status: { in: LIVE_STATUSES } },
        include: {
          category: true,
          images: {
            where: { deletedAt: null },
            include: { media: true },
            orderBy: { sortOrder: "asc" },
          },
          variants: { where: { deletedAt: null } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.product.count(),
    ]);
    // An empty products table means the database was never seeded: keep the
    // site up on the file rather than showing an empty shop.
    if (total === 0) return null;

    return rows
      .map((row): Product => {
        const file = fileBySlug.get(row.slug);
        const dbImages = unique(row.images.map((i) => i.media.url));
        const image =
          dbImages[0] ?? file?.image ?? "/brand/elijays-storefront.webp";
        // The seed only stored each product's main photo, so keep the file's
        // extra gallery shots unless the admin has added more photos since.
        const images =
          dbImages.length > 1
            ? dbImages
            : unique([image, ...(file?.images ?? [])]);
        const colours = unique(row.variants.map((v) => v.colour));
        const sizes = unique(row.variants.map((v) => v.size));
        const fabric =
          row.fabric && typeof row.fabric === "object" && "composition" in row.fabric
            ? String((row.fabric as { composition: unknown }).composition)
            : file?.fabric;

        return {
          id: row.id,
          slug: row.slug,
          name: row.name,
          subtitle: row.shortLine ?? file?.subtitle ?? "",
          description: row.description ?? file?.description ?? "",
          price: row.priceKes,
          category: file?.category ?? storefrontCategory(row.category?.slug, row.name),
          subcategory: file?.subcategory ?? "",
          colours: colours.length ? colours : file?.colours,
          sizes: sizes.length ? sizes : file?.sizes,
          fabric,
          fit: file?.fit,
          occasion: row.occasions.length ? row.occasions : file?.occasion,
          image,
          images: images.length > 1 ? images : undefined,
          stockHint:
            row.status === ProductStatus.SOLD_OUT ? "Sold out" : file?.stockHint,
          pairsWith: file?.pairsWith,
          // "New" tag: the file's curated date, else when it first went live —
          // not every edit, or each price change would re-flag it as new.
          updatedAt:
            file?.updatedAt ?? (row.publishedAt ?? row.createdAt).toISOString(),
          isBestseller: row.isBestseller,
          isBespoke: row.isBespoke,
          arriving: file?.arriving,
          giftOptions: file?.giftOptions,
        };
      })
      .sort((a, b) => {
        // Keep the file's hand-picked order; new admin products go first.
        const ai = fileOrder.get(a.slug) ?? -1;
        const bi = fileOrder.get(b.slug) ?? -1;
        return ai - bi;
      });
  } catch (error) {
    console.error("[catalog] database unavailable, using product file", error);
    return null;
  }
}

/** Storefront products, read once per request. */
export const getCatalogProducts = cache(
  async (): Promise<Product[]> => (await loadFromDb()) ?? fileProducts,
);

export async function getCatalog() {
  return createCatalog(await getCatalogProducts());
}
