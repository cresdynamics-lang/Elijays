import { NextRequest, NextResponse } from "next/server";
import { PaymentMethod, PaymentStatus, OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { coopConfig, coopStkPush } from "@/lib/payments/coop";

/**
 * Initiate Co-op Bank sandbox/production STK Push for a checkout order.
 * Creates a PENDING Payment row keyed by CheckoutRequestID / MessageReference.
 */
export async function POST(req: NextRequest) {
  const cfg = coopConfig();
  if (!cfg.configured) {
    return NextResponse.json(
      {
        error:
          "Co-op Bank keys not set. Add COOP_CONSUMER_KEY and COOP_CONSUMER_SECRET (sandbox).",
        callbackUrl: cfg.callbackUrl,
        stkUrl: cfg.stkUrl,
      },
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

  const order = await prisma.order.findFirst({
    where: {
      deletedAt: null,
      ...(orderId
        ? { id: orderId }
        : token
          ? { checkoutToken: token }
          : { id: "__none__" }),
    },
  });

  if (!order) {
    return NextResponse.json(
      { error: "Order not found — complete customer details first" },
      { status: 404 },
    );
  }

  const amount = Math.max(
    1,
    Math.round(Number(body.amountKes) || order.totalKes || order.subtotalKes),
  );

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
          internalNote: "Co-op STK initiated",
        },
      });
    }

    return NextResponse.json({
      ok: true,
      paymentId: payment.id,
      orderId: order.id,
      checkoutRequestId: stk.checkoutRequestId,
      messageReference: stk.messageReference,
      customerMessage: stk.customerMessage,
      callbackUrl: cfg.callbackUrl,
      provider: "coop-bank",
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Co-op STK failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
