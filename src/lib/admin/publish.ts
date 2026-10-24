import { ProductStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { writeAudit } from "@/lib/admin/audit";

/**
 * New products start as drafts while they're being typed in. Once one has a
 * real name, a price, a category and at least one photo it goes live on its own,
 * so finished products don't sit in "In progress" waiting for a Publish click.
 *
 * Only products that were never published are promoted: one taken down on
 * purpose (it keeps its publishedAt) stays hidden.
 */
export async function publishIfReady(productId: string, actorId?: string) {
  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      deletedAt: null,
      status: ProductStatus.DRAFT,
      publishedAt: null,
    },
    include: {
      _count: { select: { images: { where: { deletedAt: null } } } },
    },
  });
  if (!product) return false;

  const ready =
    product.name.trim() !== "" &&
    product.name !== "Untitled product" &&
    product.priceKes > 0 &&
    !!product.categoryId &&
    product._count.images > 0;
  if (!ready) return false;

  await prisma.product.update({
    where: { id: productId },
    data: { status: ProductStatus.PUBLISHED, publishedAt: new Date() },
  });
  await writeAudit({
    actorId,
    action: "Published product (ready: name, price, category, photo)",
    entityType: "product",
    entityId: productId,
    entityLabel: product.name,
  });
  return true;
}
