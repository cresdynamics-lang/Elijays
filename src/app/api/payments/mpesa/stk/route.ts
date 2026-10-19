import { NextRequest, NextResponse } from "next/server";
import { PaymentMethod, PaymentStatus, OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { mpesaConfig, stkPush } from "@/lib/payments/mpesa";

/**
 * Initiate Lipa Na M-Pesa STK Push for a checkout token / order.
 * Creates a PENDING Payment row keyed by CheckoutRequestID.
 */
export async function POST(req: NextRequest) {
  const cfg = mpesaConfig();
  if (!cfg.configured) {
    return NextResponse.json(
      {
        error:
          "M-Pesa keys not set. Add MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET, MPESA_SHORTCODE, MPESA_PASSKEY (or COOP_* equivalents).",
        callbackUrl: cfg.callbackUrl,
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
    const stk = await stkPush({
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
        providerRef: stk.CheckoutRequestID,
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
          internalNote: "M-Pesa STK initiated",
        },
      });
    }

    return NextResponse.json({
      ok: true,
      paymentId: payment.id,
      orderId: order.id,
      checkoutRequestId: stk.CheckoutRequestID,
      customerMessage: stk.CustomerMessage,
      callbackUrl: cfg.callbackUrl,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "STK failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
