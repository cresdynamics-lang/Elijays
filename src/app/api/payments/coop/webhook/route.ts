import { NextRequest, NextResponse } from "next/server";
import { OrderStatus, PaymentStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  parseCoopCallback,
  type CoopCallbackPayload,
} from "@/lib/payments/coop";

/**
 * Co-op Bank STK callback (sandbox + production).
 * Register: https://elijays-mens-wear.co.ke/api/payments/coop/webhook
 */
export async function POST(req: NextRequest) {
  let payload: CoopCallbackPayload;
  try {
    payload = (await req.json()) as CoopCallbackPayload;
  } catch {
    return NextResponse.json({ ResultCode: 1, ResultDesc: "Invalid JSON" });
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
        internalNote: `Co-op paid · ${parsed.receipt || parsed.providerRef}`,
      },
    });
  } else {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: PaymentStatus.FAILED },
    });
  }

  return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    endpoint: "Co-op Bank STK callback",
    path: "/api/payments/coop/webhook",
    provider: "coop-bank",
  });
}
