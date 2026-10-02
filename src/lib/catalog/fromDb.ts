import { prisma } from "@/lib/db";

/** Published catalogue from Postgres — used when DB is available. */
export async function getPublishedProductsFromDb() {
  try {
    return await prisma.product.findMany({
      where: {
        deletedAt: null,
        status: { in: ["PUBLISHED", "LOW_STOCK", "SOLD_OUT"] },
      },
      include: {
        category: true,
        images: {
          where: { deletedAt: null },
          include: { media: true },
          orderBy: { sortOrder: "asc" },
          take: 1,
        },
        variants: { where: { deletedAt: null } },
      },
      orderBy: { updatedAt: "desc" },
    });
  } catch {
    return null;
  }
}

export async function getProductBySlugFromDb(slug: string) {
  try {
    return await prisma.product.findFirst({
      where: { slug, deletedAt: null },
      include: {
        category: true,
        images: {
          where: { deletedAt: null },
          include: { media: true },
          orderBy: { sortOrder: "asc" },
        },
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
  } catch {
    return null;
  }
}

export async function getNavCategoriesFromDb() {
  try {
    return await prisma.category.findMany({
      where: { deletedAt: null, enabled: true, parentId: null },
      include: {
        image: true,
        children: {
          where: { deletedAt: null, enabled: true },
          orderBy: { sortOrder: "asc" },
        },
        navItems: {
          where: { deletedAt: null, enabled: true },
          orderBy: { sortOrder: "asc" },
        },
      },
      orderBy: { sortOrder: "asc" },
    });
  } catch {
    return null;
  }
}
