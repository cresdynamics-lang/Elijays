"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import {
  OrderChannel,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from "@prisma/client";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import { canAccess } from "@/lib/auth/permissions";
import { writeAudit } from "@/lib/admin/audit";
import {
  coopStkPush,
  normalizePhone,
  publicMpesaError,
  publicMpesaPrompt,
} from "@/lib/payments/coop";
import { SITE_URL } from "@/lib/constants";

export type PaymentDeskState = {
  error?: string;
  ok?: string;
  intent?: "prompt" | "link";
  orderNumber?: number;
  url?: string;
  phone?: string;
  amountKes?: number;
};

function parseAmount(formData: FormData) {
  const raw = String(formData.get("amountKes") || "").replace(/[^\d.]/g, "");
  const n = Math.round(Number(raw));
  if (!Number.isFinite(n) || n < 1) return null;
  return n;
}

async function requireSales() {
  const user = await getSessionUser();
  if (
    !user ||
    !(
      user.role === "OWNER" ||
      ("allowedModules" in user &&
        Array.isArray(user.allowedModules) &&
        user.allowedModules.includes("orders")) ||
      canAccess(user.role, "orders")
    )
  ) {
    throw new Error("Forbidden");
  }
  return user;
}

async function createDeskOrder(input: {
  amountKes: number;
  name: string;
  phone: string | null;
  note: string;
  desk: "prompt" | "link";
}) {
  const token = randomUUID();
  const label =
    input.note ||
    (input.desk === "prompt" ? "In-store M-Pesa" : "Payment link");
  return prisma.order.create({
    data: {
      status: OrderStatus.NEW,
      channel: OrderChannel.SHOP,
      subtotalKes: input.amountKes,
      totalKes: input.amountKes,
      guestName: input.name || "Walk-in",
      guestPhone: input.phone,
      checkoutToken: token,
      internalNote: input.note || null,
      addressJson: { desk: input.desk },
      items: {
        create: {
          name: label.slice(0, 80),
          qty: 1,
          unitKes: input.amountKes,
        },
      },
    },
  });
}

export async function promptInStore(
  _prev: PaymentDeskState,
  formData: FormData,
): Promise<PaymentDeskState> {
  try {
    const user = await requireSales();
    const amountKes = parseAmount(formData);
    const name = String(formData.get("name") || "").trim();
    const phoneRaw = String(formData.get("phone") || "").trim();
    const note = String(formData.get("note") || "").trim();
    if (!amountKes) return { error: "Enter an amount in KES.", intent: "prompt" };
    if (!phoneRaw) return { error: "Enter the customer’s M-Pesa number.", intent: "prompt" };

    let phone: string;
    try {
      phone = normalizePhone(phoneRaw);
    } catch (e) {
      return {
        error: e instanceof Error ? e.message : "Enter a valid Kenyan phone.",
        intent: "prompt",
      };
    }

    const order = await createDeskOrder({
      amountKes,
      name,
      phone,
      note,
      desk: "prompt",
    });

    const stk = await coopStkPush({
      phone,
      amountKes,
      accountReference: `EJ${order.number}`,
      description: "ELIJAYS",
    });

    await prisma.payment.create({
      data: {
        orderId: order.id,
        method: PaymentMethod.MPESA,
        status: PaymentStatus.PENDING,
        amountKes,
        providerRef: stk.checkoutRequestId,
      },
    });

    await writeAudit({
      actorId: user.id,
      action: "In-store STK prompt",
      entityType: "order",
      entityId: order.id,
      entityLabel: `Order #${order.number}`,
      after: { amountKes, phone, messageReference: stk.messageReference },
    });

    revalidatePath("/admin/payments");
    revalidatePath("/admin/orders");
    return {
      ok:
        publicMpesaPrompt(stk.customerMessage) ||
        "PIN prompt sent. Ask the customer to enter their M-Pesa PIN.",
      intent: "prompt",
      orderNumber: order.number,
      phone,
      amountKes,
    };
  } catch (e) {
    return {
      error: publicMpesaError(
        e instanceof Error ? e.message : "Could not send M-Pesa prompt.",
      ),
      intent: "prompt",
    };
  }
}

export async function createPaymentLink(
  _prev: PaymentDeskState,
  formData: FormData,
): Promise<PaymentDeskState> {
  try {
    const user = await requireSales();
    const amountKes = parseAmount(formData);
    const name = String(formData.get("name") || "").trim();
    const phoneRaw = String(formData.get("phone") || "").trim();
    const note = String(formData.get("note") || "").trim();
    if (!amountKes) return { error: "Enter an amount in KES.", intent: "link" };

    let phone: string | null = null;
    if (phoneRaw) {
      try {
        phone = normalizePhone(phoneRaw);
      } catch (e) {
        return {
          error: e instanceof Error ? e.message : "Enter a valid Kenyan phone.",
          intent: "link",
        };
      }
    }

    const order = await createDeskOrder({
      amountKes,
      name,
      phone,
      note,
      desk: "link",
    });
    const url = `${SITE_URL}/pay/${order.checkoutToken}`;

    await writeAudit({
      actorId: user.id,
      action: "Created payment link",
      entityType: "order",
      entityId: order.id,
      entityLabel: `Order #${order.number}`,
      after: { amountKes, url, phone },
    });

    revalidatePath("/admin/payments");
    revalidatePath("/admin/orders");
    return {
      ok: "Payment link ready. Send it to the customer to settle.",
      intent: "link",
      orderNumber: order.number,
      url,
      phone: phone || undefined,
      amountKes,
    };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Could not create payment link.",
      intent: "link",
    };
  }
}
