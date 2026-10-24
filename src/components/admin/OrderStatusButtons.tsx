"use client";

import { useTransition } from "react";
import { OrderStatus } from "@prisma/client";
import { updateOrderStatus } from "@/app/admin/(panel)/orders/actions";

const NEXT: Partial<Record<OrderStatus, OrderStatus>> = {
  NEW: OrderStatus.PAID,
  PAID: OrderStatus.PREPARING,
  PREPARING: OrderStatus.ALTERATION,
  ALTERATION: OrderStatus.OUT_FOR_DELIVERY,
  OUT_FOR_DELIVERY: OrderStatus.DELIVERED,
};

export function OrderStatusButtons({
  orderId,
  status,
}: {
  orderId: string;
  status: OrderStatus;
}) {
  const [pending, start] = useTransition();
  const next = NEXT[status];

  return (
    <div className="flex flex-wrap gap-2">
      {next ? (
        <button
          type="button"
          disabled={pending}
          onClick={() => start(() => updateOrderStatus(orderId, next))}
          className="rounded-full border border-gold/40 bg-gold/10 px-4 py-2 text-xs uppercase tracking-widest text-gold disabled:opacity-50"
        >
          Mark {next.replace(/_/g, " ").toLowerCase()}
        </button>
      ) : null}
      {status !== OrderStatus.CANCELLED && status !== OrderStatus.DELIVERED ? (
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            start(() => updateOrderStatus(orderId, OrderStatus.CANCELLED))
          }
          className="rounded-full border border-line px-4 py-2 text-xs uppercase tracking-widest text-ivory-muted disabled:opacity-50"
        >
          Cancel
        </button>
      ) : null}
    </div>
  );
}
