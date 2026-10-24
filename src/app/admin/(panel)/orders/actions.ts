"use server";

import { revalidatePath } from "next/cache";
import { OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import { userCan } from "@/lib/auth/permissions";
import { writeAudit } from "@/lib/admin/audit";

export async function updateOrderStatus(id: string, status: OrderStatus) {
  const user = await getSessionUser();
  if (!user || !userCan(user, "orders")) throw new Error("Forbidden");
  const before = await prisma.order.findFirst({ where: { id, deletedAt: null } });
  if (!before) return;
  await prisma.order.update({ where: { id }, data: { status } });
  await writeAudit({
    actorId: user.id,
    action: `Moved order to ${status}`,
    entityType: "order",
    entityId: id,
    entityLabel: `Order #${before.number}`,
    before: { status: before.status },
    after: { status },
  });
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
  revalidatePath("/admin");
}
