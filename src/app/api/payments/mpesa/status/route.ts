import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/** Poll payment status after STK Push (by paymentId or checkoutRequestId). */
export async function GET(req: NextRequest) {
  const paymentId = req.nextUrl.searchParams.get("paymentId");
  const checkoutRequestId = req.nextUrl.searchParams.get("checkoutRequestId");
  const token = req.nextUrl.searchParams.get("token");

  if (!paymentId && !checkoutRequestId && !token) {
    return NextResponse.json({ error: "paymentId or token required" }, { status: 400 });
  }

  const payment = await prisma.payment.findFirst({
    where: {
      deletedAt: null,
      ...(paymentId
        ? { id: paymentId }
        : checkoutRequestId
          ? { providerRef: checkoutRequestId }
          : {
              order: { checkoutToken: token!, deletedAt: null },
              method: "MPESA",
            }),
    },
    orderBy: { createdAt: "desc" },
    include: {
      order: { select: { id: true, number: true, status: true } },
    },
  });

  if (!payment) {
    return NextResponse.json({ status: "missing" });
  }

  return NextResponse.json({
    status: payment.status,
    paymentId: payment.id,
    mpesaReceipt: payment.mpesaReceipt,
    amountKes: payment.amountKes,
    orderId: payment.orderId,
    orderNumber: payment.order.number,
    orderStatus: payment.order.status,
  });
}
