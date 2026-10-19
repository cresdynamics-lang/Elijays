import { NextRequest, NextResponse } from "next/server";
import { OrderStatus, PaymentStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  parseStkCallback,
  type StkCallbackBody,
} from "@/lib/payments/mpesa";

/**
 * Safaricom / Co-op M-Pesa STK callback.
 * URL to register with the bank: /api/payments/mpesa/callback
 * (also aliased at /api/payments/coop/webhook)
 */
export async function POST(req: NextRequest) {
  let payload: StkCallbackBody;
  try {
    payload = (await req.json()) as StkCallbackBody;
  } catch {
    return NextResponse.json({ ResultCode: 1, ResultDesc: "Invalid JSON" });
  }

  const parsed = parseStkCallback(payload);
  // Always ACK Safaricom quickly even if we can't match
  if (!parsed?.checkoutRequestId) {
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
  }

  const payment = await prisma.payment.findFirst({
    where: {
      providerRef: parsed.checkoutRequestId,
      deletedAt: null,
    },
    include: { order: true },
  });

  if (!payment) {
    console.warn(
      "[mpesa/callback] no payment for",
      parsed.checkoutRequestId,
    );
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
  }

  if (parsed.resultCode === 0) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.PAID,
        mpesaReceipt: parsed.mpesaReceipt || payment.mpesaReceipt,
        paidAt: new Date(),
        amountKes: parsed.amount || payment.amountKes,
      },
    });
    await prisma.order.update({
      where: { id: payment.orderId },
      data: {
        status: OrderStatus.PAID,
        internalNote: `M-Pesa paid · ${parsed.mpesaReceipt || parsed.checkoutRequestId}`,
      },
    });
  } else {
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.FAILED,
      },
    });
  }

  return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    endpoint: "M-Pesa STK callback",
    path: "/api/payments/mpesa/callback",
  });
}
