import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/** Poll Co-op payment status after STK Push. */
export async function GET(req: NextRequest) {
  const paymentId = req.nextUrl.searchParams.get("paymentId");
  const checkoutRequestId = req.nextUrl.searchParams.get("checkoutRequestId");
  const token = req.nextUrl.searchParams.get("token");

  if (!paymentId && !checkoutRequestId && !token) {
    return NextResponse.json(
      { error: "paymentId or token required" },
      { status: 400 },
    );
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
    receipt: payment.mpesaReceipt,
    mpesaReceipt: payment.mpesaReceipt,
    amountKes: payment.amountKes,
    orderId: payment.orderId,
    orderNumber: payment.order.number,
    orderStatus: payment.order.status,
    provider: "coop-bank",
  });
}
