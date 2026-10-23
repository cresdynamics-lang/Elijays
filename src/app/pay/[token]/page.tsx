import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { OrderStatus } from "@prisma/client";
import { BRAND, formatKes } from "@/lib/constants";
import { PayClient } from "./PayClient";

export default async function PayPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const order = await prisma.order.findFirst({
    where: { checkoutToken: token, deletedAt: null },
    include: {
      payments: {
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });
  if (!order) notFound();

  const paid =
    order.status === OrderStatus.PAID || order.payments[0]?.status === "PAID";
  const receipt = order.payments.find((p) => p.mpesaReceipt)?.mpesaReceipt;

  return (
    <div className="atmosphere min-h-screen px-5 pb-28 pt-36">
      <div className="mx-auto max-w-xl">
        <Link href="/" className="text-xs uppercase tracking-[0.2em] text-ivory/45">
          {BRAND.fullName}
        </Link>
        {paid ? (
          <div className="mt-10 text-center">
            <p className="eyebrow">Paid</p>
            <h1 className="display mt-4 text-5xl">Payment confirmed</h1>
            <p className="whisper mt-6 text-xl">
              {formatKes(order.totalKes)}
              {receipt ? ` · ${receipt}` : ""}.
            </p>
            <p className="mt-4 text-sm text-ivory/45">
              A stylist will confirm on WhatsApp if needed — {BRAND.phone}
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href={`/invoice/${token}`} className="btn-gold">
                View receipt
              </Link>
              <a
                href={`/api/invoice/${token}`}
                className="btn-ghost"
                target="_blank"
                rel="noreferrer"
              >
                Open PDF
              </a>
            </div>
          </div>
        ) : (
          <div className="mt-10">
            <PayClient
              token={token}
              amountKes={order.totalKes}
              name={order.guestName || ""}
              note={order.internalNote || ""}
              phone={order.guestPhone || ""}
            />
          </div>
        )}
      </div>
    </div>
  );
}
