import { prisma } from "@/lib/db";
import { AppointmentStatus, BespokeStatus, OrderStatus } from "@prisma/client";

export type NavBadges = {
  lowStock: number;
  orders: number;
  bespoke: number;
};

export async function getNavBadges(): Promise<NavBadges> {
  const [stockLevels, orders, bespokeNew, appointmentsRequested] =
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
      prisma.bespokeRequest.count({
        where: { deletedAt: null, status: BespokeStatus.NEW },
      }),
      prisma.appointment.count({
        where: { deletedAt: null, status: AppointmentStatus.REQUESTED },
      }),
    ]);

  const lowStock = stockLevels.filter((s) => s.quantity <= s.alertAt).length;

  return {
    lowStock,
    orders,
    bespoke: bespokeNew + appointmentsRequested,
  };
}
