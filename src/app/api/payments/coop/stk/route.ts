import { NextRequest, NextResponse } from "next/server";
import { PaymentMethod, PaymentStatus, OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  coopConfig,
  coopStkPush,
  publicMpesaError,
  publicMpesaPrompt,
} from "@/lib/payments/coop";

/**
 * Initiate Co-op Bank sandbox/production STK Push for a checkout order.
 * Creates a PENDING Payment row keyed by CheckoutRequestID / MessageReference.
 */
export async function POST(req: NextRequest) {
  const cfg = coopConfig();
  if (!cfg.configured) {
    return NextResponse.json(
      { error: "M-Pesa is temporarily unavailable. Try again shortly." },
      { status: 503 },
    );
  }

  let body: {
    token?: string;
    orderId?: string;
    phone?: string;
    amountKes?: number;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const token = String(body.token || "").trim();
  const orderId = String(body.orderId || "").trim();
  const phone = String(body.phone || "").trim();

  if (!phone) {
    return NextResponse.json({ error: "phone required" }, { status: 400 });
  }
  if (!orderId && !token) {
    return NextResponse.json(
      { error: "Order not found — complete customer details first" },
      { status: 404 },
    );
  }

  const order = await prisma.order.findFirst({
    where: {
      deletedAt: null,
      ...(orderId ? { id: orderId } : { checkoutToken: token }),
    },
  });

  if (!order) {
    return NextResponse.json(
      { error: "Order not found — complete customer details first" },
      { status: 404 },
    );
  }

  const amount = Math.max(1, Math.round(order.totalKes || order.subtotalKes));

  try {
    const stk = await coopStkPush({
      phone,
      amountKes: amount,
      accountReference: `EJ${order.number}`,
      description: "ELIJAYS",
    });

    const payment = await prisma.payment.create({
      data: {
        orderId: order.id,
        method: PaymentMethod.MPESA,
        status: PaymentStatus.PENDING,
        amountKes: amount,
        providerRef: stk.checkoutRequestId,
      },
    });

    if (
      order.status === OrderStatus.ABANDONED ||
      order.status === OrderStatus.NEW
    ) {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.NEW,
          internalNote: "M-Pesa PIN prompt sent",
        },
      });
    }

    return NextResponse.json({
      ok: true,
      paymentId: payment.id,
      orderId: order.id,
      customerMessage: publicMpesaPrompt(stk.customerMessage),
    });
  } catch (e) {
    const raw = e instanceof Error ? e.message : "";
    const message = publicMpesaError(raw);
    const badPhone = /valid kenyan phone/i.test(raw);
    return NextResponse.json(
      { error: message },
      { status: badPhone ? 400 : 502 },
    );
  }
}
