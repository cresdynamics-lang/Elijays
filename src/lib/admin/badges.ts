import { prisma } from "@/lib/db";
import { OrderStatus } from "@prisma/client";

export type NavBadges = {
  lowStock: number;
  orders: number;
};

export async function getNavBadges(): Promise<NavBadges> {
  const [stockLevels, orders] =
    await Promise.all([
      prisma.stockLevel.findMany({
        where: { deletedAt: null },
        select: { quantity: true, alertAt: true },
      }),
      prisma.order.count({
        where: {
          deletedAt: null,
          status: { in: [OrderStatus.NEW, OrderStatus.PAID, OrderStatus.PREPARING] },
        },
      }),
    ]);

  const lowStock = stockLevels.filter((s) => s.quantity <= s.alertAt).length;

  return {
    lowStock,
    orders,
  };
}
