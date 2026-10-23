import { NextRequest, NextResponse } from "next/server";
import { OrderStatus, PaymentStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { coopStkStatus } from "@/lib/payments/coop";

/** Poll Co-op payment status after STK Push. Hits Co-op enquiry if still pending. */
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

  let payment = await prisma.payment.findFirst({
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

  if (payment.status === PaymentStatus.PENDING && payment.providerRef) {
    try {
      const enquiry = await coopStkStatus(payment.providerRef);
      if (enquiry.paid) {
        payment = await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: PaymentStatus.PAID,
            mpesaReceipt: enquiry.receipt || payment.mpesaReceipt,
            paidAt: new Date(),
            amountKes: enquiry.amount || payment.amountKes,
          },
          include: {
            order: { select: { id: true, number: true, status: true } },
          },
        });
        await prisma.order.update({
          where: { id: payment.orderId },
          data: {
            status: OrderStatus.PAID,
            internalNote: `M-Pesa paid · ${enquiry.receipt || payment.providerRef}`,
          },
        });
      } else if (enquiry.failed) {
        payment = await prisma.payment.update({
          where: { id: payment.id },
          data: { status: PaymentStatus.FAILED },
          include: {
            order: { select: { id: true, number: true, status: true } },
          },
        });
      }
    } catch {
      /* keep last known DB status */
    }
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
  });
}
