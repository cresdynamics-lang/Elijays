"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ProductStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import { userCan } from "@/lib/auth/permissions";
import { writeAudit } from "@/lib/admin/audit";

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function createProduct(formData: FormData) {
  const user = await getSessionUser();
  if (!user || !userCan(user, "products")) throw new Error("Forbidden");

  const name = String(formData.get("name") || "").trim();
  const sku = String(formData.get("sku") || "").trim();
  const priceKes = Number(formData.get("priceKes") || 0);
  const shortLine = String(formData.get("shortLine") || "").trim() || null;
  const description = String(formData.get("description") || "").trim() || null;
  const status = (String(formData.get("status") || "DRAFT") as ProductStatus) || ProductStatus.DRAFT;

  if (!name || !sku || !priceKes) throw new Error("Name, SKU and price are required");

  const categoryId = String(formData.get("categoryId") || "").trim() || null;

  const product = await prisma.product.create({
    data: {
      name,
      sku,
      slug: slugify(name),
      priceKes,
      shortLine,
      description,
      status,
      categoryId,
      publishedAt: status === ProductStatus.PUBLISHED ? new Date() : null,
    },
  });

  await writeAudit({
    actorId: user.id,
    action: "Created product",
    entityType: "product",
    entityId: product.id,
    entityLabel: product.name,
    after: { sku, status, priceKes },
  });

  revalidatePath("/admin/products");
  redirect(`/admin/products/${product.id}`);
}

export async function updateProduct(id: string, formData: FormData) {
  const user = await getSessionUser();
  if (!user || !userCan(user, "products")) throw new Error("Forbidden");

  const before = await prisma.product.findFirst({ where: { id, deletedAt: null } });
  if (!before) throw new Error("Not found");

  const name = String(formData.get("name") || before.name).trim();
  const shortLine = String(formData.get("shortLine") || "").trim() || null;
  const description = String(formData.get("description") || "").trim() || null;
  const priceKes = Number(formData.get("priceKes") || before.priceKes);
  const status = String(formData.get("status") || before.status) as ProductStatus;

  const updated = await prisma.product.update({
    where: { id },
    data: {
      name,
      shortLine,
      description,
      priceKes,
      status,
      publishedAt:
        status === ProductStatus.PUBLISHED
          ? before.publishedAt ?? new Date()
          : before.publishedAt,
    },
  });

  await writeAudit({
    actorId: user.id,
    action: "Updated product",
    entityType: "product",
    entityId: id,
    entityLabel: updated.name,
    before: { name: before.name, priceKes: before.priceKes, status: before.status },
    after: { name, priceKes, status },
  });

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${id}`);
  revalidatePath("/admin");
}

export async function autosaveProduct(input: {
  id?: string | null;
  name: string;
  sku: string;
  categoryId?: string | null;
  priceKes: number;
  shortLine?: string;
  description?: string;
  seoTitle?: string;
  seoDescription?: string;
  publish?: boolean;
}) {
  const user = await getSessionUser();
  if (!user || !userCan(user, "products")) throw new Error("Forbidden");

  const name = input.name.trim() || "Untitled product";
  const sku =
    input.sku.trim() ||
    `EJ-TMP-${Date.now().toString(36).toUpperCase()}`;
  const status = input.publish ? ProductStatus.PUBLISHED : ProductStatus.DRAFT;
  const seoTitle = input.seoTitle?.trim() || null;
  const seoDescription = input.seoDescription?.trim() || null;

  if (input.id) {
    const updated = await prisma.product.update({
      where: { id: input.id },
      data: {
        name,
        sku,
        slug: slugify(name),
        categoryId: input.categoryId || null,
        priceKes: input.priceKes || 0,
        shortLine: input.shortLine?.trim() || null,
        description: input.description?.trim() || null,
        seoTitle,
        seoDescription,
        status: input.publish ? ProductStatus.PUBLISHED : undefined,
        publishedAt: input.publish ? new Date() : undefined,
      },
    });
    revalidatePath("/admin/products");
    return { id: updated.id };
  }

  const created = await prisma.product.create({
    data: {
      name,
      sku,
      slug: `${slugify(name)}-${Date.now().toString(36)}`,
      categoryId: input.categoryId || null,
      priceKes: input.priceKes || 0,
      shortLine: input.shortLine?.trim() || null,
      description: input.description?.trim() || null,
      seoTitle,
      seoDescription,
      status,
      publishedAt: input.publish ? new Date() : null,
    },
  });

  await writeAudit({
    actorId: user.id,
    action: input.publish ? "Published product" : "Autosaved product (in progress)",
    entityType: "product",
    entityId: created.id,
    entityLabel: created.name,
  });

  revalidatePath("/admin/products");
  return { id: created.id };
}

export async function publishProduct(id: string) {
  const user = await getSessionUser();
  if (!user || !userCan(user, "products")) throw new Error("Forbidden");
  await prisma.product.update({
    where: { id },
    data: { status: ProductStatus.PUBLISHED, publishedAt: new Date() },
  });
  await writeAudit({
    actorId: user.id,
    action: "Published product",
    entityType: "product",
    entityId: id,
  });
  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${id}`);
}

export async function archiveProduct(id: string) {
  const user = await getSessionUser();
  if (!user || !userCan(user, "products")) throw new Error("Forbidden");
  const before = await prisma.product.findFirst({ where: { id, deletedAt: null } });
  if (!before) return;
  await prisma.product.update({
    where: { id },
    data: { status: ProductStatus.ARCHIVED },
  });
  await writeAudit({
    actorId: user.id,
    action: "Archived product",
    entityType: "product",
    entityId: id,
    entityLabel: before.name,
  });
  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${id}`);
}

export type StockSaveInput = {
  colours: { name: string; imageUrl?: string | null }[];
  sizes: string[];
  quantities: { colour: string; size: string; quantity: number }[];
  alertAt: number;
};

function variantSku(productSku: string, colour: string, size: string) {
  const c = colour.replace(/[^A-Za-z0-9]/g, "").slice(0, 6).toUpperCase() || "CLR";
  const s = size.replace(/[^A-Za-z0-9]/g, "").slice(0, 6).toUpperCase() || "OS";
  return `${productSku}-${c}-${s}`.slice(0, 48);
}

async function stockLocations() {
  let shop = await prisma.location.findFirst({
    where: { code: "SHOP", deletedAt: null },
  });
  let web = await prisma.location.findFirst({
    where: { code: "WEB", deletedAt: null },
  });
  if (!shop) {
    shop = await prisma.location.create({
      data: { code: "SHOP", name: "Shop floor" },
    });
  }
  if (!web) {
    web = await prisma.location.create({
      data: { code: "WEB", name: "Website" },
    });
  }
  return { shop, web };
}

export async function saveProductStock(productId: string, input: StockSaveInput) {
  const user = await getSessionUser();
  if (!user || (!userCan(user, "products") && !userCan(user, "inventory"))) {
    throw new Error("Forbidden");
  }

  const product = await prisma.product.findFirst({
    where: { id: productId, deletedAt: null },
  });
  if (!product) throw new Error("Not found");

  const colours = input.colours
    .map((c) => ({ name: c.name.trim(), imageUrl: c.imageUrl?.trim() || null }))
    .filter((c) => c.name);
  const sizes = [...new Set(input.sizes.map((s) => s.trim()).filter(Boolean))];
  if (colours.length === 0 || sizes.length === 0) {
    throw new Error("Add at least one colour and one size");
  }

  const alertAt = Number.isFinite(input.alertAt)
    ? Math.max(0, Math.round(input.alertAt))
    : 2;

  const qtyMap = new Map<string, number>();
  for (const row of input.quantities) {
    const colour = row.colour.trim();
    const size = row.size.trim();
    if (!colour || !size) continue;
    qtyMap.set(
      `${colour}::${size}`,
      Math.max(0, Math.round(Number(row.quantity) || 0)),
    );
  }

  const { shop, web } = await stockLocations();
  const existing = await prisma.productVariant.findMany({
    where: { productId },
  });

  const keepIds = new Set<string>();
  let total = 0;
  let anyLow = false;

  for (const colour of colours) {
    for (const size of sizes) {
      const quantity = qtyMap.get(`${colour.name}::${size}`) ?? 0;
      total += quantity;
      if (quantity <= alertAt) anyLow = true;

      let variant = existing.find(
        (v) => v.colour === colour.name && v.size === size,
      );
      if (!variant) {
        const skuBase = variantSku(product.sku, colour.name, size);
        try {
          variant = await prisma.productVariant.create({
            data: {
              productId,
              sku: skuBase,
              colour: colour.name,
              size,
              priceKes: product.priceKes,
            },
          });
        } catch {
          variant = await prisma.productVariant.create({
            data: {
              productId,
              sku: `${skuBase}-${Date.now().toString(36).slice(-4)}`.slice(0, 48),
              colour: colour.name,
              size,
              priceKes: product.priceKes,
            },
          });
        }
      } else if (variant.deletedAt) {
        variant = await prisma.productVariant.update({
          where: { id: variant.id },
          data: { deletedAt: null, priceKes: product.priceKes },
        });
      }
      keepIds.add(variant.id);

      for (const location of [shop, web]) {
        await prisma.stockLevel.upsert({
          where: {
            variantId_locationId: {
              variantId: variant.id,
              locationId: location.id,
            },
          },
          create: {
            variantId: variant.id,
            locationId: location.id,
            quantity,
            alertAt,
          },
          update: {
            quantity,
            alertAt,
            deletedAt: null,
          },
        });
      }
    }
  }

  const dropIds = existing
    .filter((v) => !v.deletedAt && !keepIds.has(v.id))
    .map((v) => v.id);
  if (dropIds.length > 0) {
    await prisma.productVariant.updateMany({
      where: { id: { in: dropIds } },
      data: { deletedAt: new Date() },
    });
  }

  const liveStatuses: ProductStatus[] = [
    ProductStatus.PUBLISHED,
    ProductStatus.LOW_STOCK,
    ProductStatus.SOLD_OUT,
  ];
  if (liveStatuses.includes(product.status)) {
    const nextStatus =
      total === 0
        ? ProductStatus.SOLD_OUT
        : anyLow
          ? ProductStatus.LOW_STOCK
          : ProductStatus.PUBLISHED;
    if (nextStatus !== product.status) {
      await prisma.product.update({
        where: { id: productId },
        data: { status: nextStatus },
      });
    }
  }

  await writeAudit({
    actorId: user.id,
    action: "Updated product stock",
    entityType: "product",
    entityId: productId,
    entityLabel: product.name,
    after: { colours: colours.map((c) => c.name), sizes, total, alertAt },
  });

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${productId}`);
  revalidatePath("/admin/stock");
  revalidatePath("/admin/inventory");
  revalidatePath("/admin");
}
