import { NextRequest, NextResponse } from "next/server";
import { OrderStatus, PaymentStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { parseCoopCallback, parseCoopCallbackText } from "@/lib/payments/coop";

/**
 * Co-op Bank STK callback.
 * Register: https://elijays-mens-wear.co.ke/api/payments/mpesa/callback
 * Alias:    https://elijays-mens-wear.co.ke/api/payments/coop/webhook
 */
export async function POST(req: NextRequest) {
  const text = await req.text();
  console.info("[coop/webhook]", req.nextUrl.pathname, text.slice(0, 500));
  const payload = parseCoopCallbackText(text);
  if (!payload) {
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
  }

  const parsed = parseCoopCallback(payload);
  if (!parsed?.providerRef) {
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
  }

  const payment = await prisma.payment.findFirst({
    where: {
      providerRef: parsed.providerRef,
      deletedAt: null,
    },
  });

  if (!payment) {
    console.warn("[coop/webhook] no payment for", parsed.providerRef);
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
  }

  if (parsed.pending) {
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
  }

  if (parsed.resultCode === 0) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.PAID,
        mpesaReceipt: parsed.receipt || payment.mpesaReceipt,
        paidAt: new Date(),
        amountKes: parsed.amount || payment.amountKes,
      },
    });
    await prisma.order.update({
      where: { id: payment.orderId },
      data: {
        status: OrderStatus.PAID,
        internalNote: `M-Pesa paid · ${parsed.receipt || parsed.providerRef}`,
      },
    });
  } else if (payment.status === PaymentStatus.PENDING) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: PaymentStatus.FAILED },
    });
  }

  return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
}

export async function GET() {
  return NextResponse.json({ ok: true });
}
