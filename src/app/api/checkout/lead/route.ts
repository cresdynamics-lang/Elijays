import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { OrderStatus, OrderChannel } from "@prisma/client";

type LeadBody = {
  token: string;
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  items?: { name: string; size?: string; qty: number; unitKes: number }[];
  subtotalKes?: number;
};

/**
 * Upsert abandoned checkout lead as the shopper types.
 * Even a single letter in the name is saved for follow-up.
 */
export async function POST(req: NextRequest) {
  let body: LeadBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const token = String(body.token || "").trim();
  if (!token) {
    return NextResponse.json({ error: "token required" }, { status: 400 });
  }

  const name = body.name?.trim() || null;
  const phone = body.phone?.trim() || null;
  const email = body.email?.trim() || null;
  const address = body.address?.trim() || null;
  const notes = body.notes?.trim() || null;
  const subtotal = Math.max(0, Number(body.subtotalKes) || 0);
  const items = Array.isArray(body.items) ? body.items : [];

  // Nothing typed yet — skip create
  if (!name && !phone && !email && !address) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const existing = await prisma.order.findFirst({
    where: { checkoutToken: token, deletedAt: null },
  });

  if (existing && existing.status !== OrderStatus.ABANDONED && existing.status !== OrderStatus.NEW) {
    return NextResponse.json({ ok: true, orderId: existing.id, locked: true });
  }

  let customerId = existing?.customerId ?? null;
  if (phone || email || name) {
    const parts = (name || "Guest").split(/\s+/);
    const firstName = parts[0] || "Guest";
    const lastName = parts.slice(1).join(" ") || "";

    if (customerId) {
      await prisma.customer.update({
        where: { id: customerId },
        data: {
          firstName,
          lastName,
          phone: phone ?? undefined,
          email: email ?? undefined,
          notes: notes ?? undefined,
        },
      });
    } else {
      const found =
        (phone
          ? await prisma.customer.findFirst({
              where: { phone, deletedAt: null },
            })
          : null) ||
        (email
          ? await prisma.customer.findFirst({
              where: { email, deletedAt: null },
            })
          : null);
      if (found) {
        customerId = found.id;
        await prisma.customer.update({
          where: { id: found.id },
          data: {
            firstName: name ? firstName : found.firstName,
            lastName: name ? lastName : found.lastName,
            phone: phone ?? found.phone,
            email: email ?? found.email,
          },
        });
      } else {
        const created = await prisma.customer.create({
          data: {
            firstName,
            lastName,
            phone,
            email,
            notes: notes ?? "Abandoned checkout lead",
            tags: ["CHECKOUT_LEAD"],
          },
        });
        customerId = created.id;
      }
    }
  }

  const orderData = {
    customerId,
    status: OrderStatus.ABANDONED,
    channel: OrderChannel.WEBSITE,
    subtotalKes: subtotal,
    totalKes: subtotal,
    guestName: name,
    guestPhone: phone,
    guestEmail: email,
    deliveryNotes: address,
    internalNote: notes
      ? `Checkout in progress / abandoned. Notes: ${notes}`
      : "Checkout in progress — follow up if abandoned",
    addressJson: address ? { line1: address } : undefined,
    checkoutToken: token,
  };

  let orderId: string;
  if (existing) {
    await prisma.order.update({
      where: { id: existing.id },
      data: orderData,
    });
    orderId = existing.id;
    if (items.length > 0) {
      await prisma.orderItem.deleteMany({ where: { orderId } });
      await prisma.orderItem.createMany({
        data: items.map((i) => ({
          orderId,
          name: i.name,
          size: i.size,
          qty: i.qty,
          unitKes: i.unitKes,
        })),
      });
    }
  } else {
    const created = await prisma.order.create({
      data: {
        ...orderData,
        items:
          items.length > 0
            ? {
                create: items.map((i) => ({
                  name: i.name,
                  size: i.size,
                  qty: i.qty,
                  unitKes: i.unitKes,
                })),
              }
            : undefined,
      },
    });
    orderId = created.id;
  }

  return NextResponse.json({ ok: true, orderId });
}
