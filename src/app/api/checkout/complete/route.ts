import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { OrderStatus } from "@prisma/client";

/** Promote abandoned checkout to a real NEW order after place-order. */
export async function POST(req: NextRequest) {
  const { token } = await req.json().catch(() => ({ token: "" }));
  if (!token) return NextResponse.json({ error: "token required" }, { status: 400 });

  const order = await prisma.order.findFirst({
    where: { checkoutToken: token, deletedAt: null },
  });
  if (!order) return NextResponse.json({ ok: true, missing: true });

  if (order.status === OrderStatus.ABANDONED || order.status === OrderStatus.NEW) {
    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: OrderStatus.NEW,
        internalNote: order.internalNote?.includes("Abandoned")
          ? "Placed via website checkout"
          : order.internalNote,
      },
    });
  }

  return NextResponse.json({ ok: true, orderId: order.id });
}
