import { prisma } from "@/lib/db";

export async function loadInvoiceOrder(token: string) {
  return prisma.order.findFirst({
    where: { checkoutToken: token, deletedAt: null },
    include: {
      items: { where: { deletedAt: null } },
      payments: { where: { deletedAt: null }, orderBy: { createdAt: "desc" } },
    },
  });
}
