"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ProductStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import { canAccess } from "@/lib/auth/permissions";
import { writeAudit } from "@/lib/admin/audit";

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function createProduct(formData: FormData) {
  const user = await getSessionUser();
  if (!user || !canAccess(user.role, "products")) throw new Error("Forbidden");

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
  if (!user || !canAccess(user.role, "products")) throw new Error("Forbidden");

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
  if (!user || !canAccess(user.role, "products")) throw new Error("Forbidden");

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
  if (!user || !canAccess(user.role, "products")) throw new Error("Forbidden");
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
  if (!user || !canAccess(user.role, "products")) throw new Error("Forbidden");
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
