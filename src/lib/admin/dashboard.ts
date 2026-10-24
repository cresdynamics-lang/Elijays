import { prisma } from "@/lib/db";
import {
  OrderStatus,
  ProductStatus,
} from "@prisma/client";
import { startOfDay, endOfDay } from "date-fns";

export async function getDashboardData(userName: string) {
  const now = new Date();
  const dayStart = startOfDay(now);
  const dayEnd = endOfDay(now);

  const waitingStatuses: OrderStatus[] = [
    OrderStatus.NEW,
    OrderStatus.PAID,
    OrderStatus.PREPARING,
    OrderStatus.ALTERATION,
  ];

  const [
    paymentsToday,
    ordersPaidToday,
    ordersWaiting,
    ordersToAction,
    abandonedLeads,
    lowStockProducts,
    bestsellers,
    publishedCount,
  ] = await Promise.all([
    prisma.payment.aggregate({
      where: {
        deletedAt: null,
        status: "PAID",
        paidAt: { gte: dayStart, lte: dayEnd },
      },
      _sum: { amountKes: true },
    }),
    prisma.order.aggregate({
      where: {
        deletedAt: null,
        status: {
          in: [
            OrderStatus.PAID,
            OrderStatus.PREPARING,
            OrderStatus.ALTERATION,
            OrderStatus.OUT_FOR_DELIVERY,
            OrderStatus.DELIVERED,
            OrderStatus.COLLECTED,
          ],
        },
        updatedAt: { gte: dayStart, lte: dayEnd },
      },
      _sum: { totalKes: true },
    }),
    prisma.order.count({
      where: {
        deletedAt: null,
        status: { in: waitingStatuses },
      },
    }),
    prisma.order.findMany({
      where: {
        deletedAt: null,
        status: { in: waitingStatuses },
      },
      orderBy: { createdAt: "asc" },
      take: 8,
      include: { customer: true },
    }),
    prisma.order.count({
      where: { deletedAt: null, status: OrderStatus.ABANDONED },
    }),
    prisma.product.findMany({
      where: {
        deletedAt: null,
        status: { in: [ProductStatus.LOW_STOCK, ProductStatus.SOLD_OUT] },
      },
      take: 5,
      orderBy: { updatedAt: "desc" },
    }),
    prisma.product.findMany({
      where: { deletedAt: null, isBestseller: true, status: ProductStatus.PUBLISHED },
      take: 5,
      orderBy: { updatedAt: "desc" },
    }),
    prisma.product.count({
      where: { deletedAt: null, status: ProductStatus.PUBLISHED },
    }),
  ]);

  const stockLevels = await prisma.stockLevel.findMany({
    where: { deletedAt: null },
    select: { quantity: true, alertAt: true },
  });
  const lowStock = stockLevels.filter((s) => s.quantity <= s.alertAt).length;

  const fromPayments = paymentsToday._sum.amountKes ?? 0;
  const fromOrders = ordersPaidToday._sum.totalKes ?? 0;
  const salesTodayKes = Math.max(fromPayments, fromOrders);

  const attention: { label: string; href: string }[] = [];
  if (lowStock > 0) {
    attention.push({ label: `${lowStock} SKUs at or below alert`, href: "/admin/stock" });
  }
  if (abandonedLeads > 0) {
    attention.push({
      label: `${abandonedLeads} abandoned checkouts to follow up`,
      href: "/admin/orders?status=ABANDONED",
    });
  }
  for (const p of lowStockProducts.slice(0, 3)) {
    attention.push({
      label: `${p.name} — check stock`,
      href: `/admin/products/${p.id}#stock`,
    });
  }

  return {
    userName,
    salesTodayKes,
    ordersWaiting,
    lowStock,
    newMessages: 0,
    abandonedLeads,
    publishedCount,
    ordersToAction,
    attention,
    bestsellers,
    generatedAt: now.toISOString(),
  };
}
