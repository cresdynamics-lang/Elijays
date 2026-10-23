import { notFound } from "next/navigation";
import Link from "next/link";
import { OrderStatus } from "@prisma/client";
import { BRAND, SITE_URL, formatKes } from "@/lib/constants";
import { fulfilmentLabel, parseAddressJson } from "@/lib/orders/fulfilment";
import { loadInvoiceOrder } from "@/lib/invoice/load";
import { InvoiceActions } from "./InvoiceActions";

export default async function InvoicePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const order = await loadInvoiceOrder(token);
  if (!order) notFound();

  const paid =
    order.status === OrderStatus.PAID ||
    order.payments.some((p) => p.status === "PAID");
  const receipt = order.payments.find((p) => p.mpesaReceipt)?.mpesaReceipt;
  const address = parseAddressJson(order.addressJson);
  const payUrl = `${SITE_URL}/pay/${token}`;
  const title = paid ? "Receipt" : "Invoice";

  return (
    <div className="atmosphere min-h-screen px-4 pb-24 pt-24 md:px-8 md:pt-32">
      <div className="invoice-sheet mx-auto max-w-2xl rounded-xl border border-[var(--line)] bg-ivory px-5 py-8 text-noir md:px-10 md:py-12">
        <div className="flex items-start justify-between gap-4 border-b border-noir/15 pb-6">
          <div>
            <p className="font-[family-name:var(--font-playfair)] text-2xl text-[#b08a3e] md:text-3xl">
              {BRAND.name}
            </p>
            <p className="mt-1 text-[11px] text-noir/60 md:text-sm">
              {BRAND.fullName}
            </p>
            <p className="mt-3 text-[11px] leading-relaxed text-noir/55 md:text-xs">
              {BRAND.address.street}
              <br />
              {BRAND.address.junction}, {BRAND.address.city}
              <br />
              {BRAND.phone} · {BRAND.email}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-[0.22em] text-noir/45">
              {title}
            </p>
            <p className="mt-1 font-[family-name:var(--font-playfair)] text-xl md:text-2xl">
              #{order.number}
            </p>
            <p className="mt-2 text-[11px] text-noir/55">
              {order.createdAt.toLocaleDateString("en-KE", { dateStyle: "medium" })}
            </p>
            <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.14em]">
              {paid ? "Paid" : "Amount due"}
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-6 text-[12px] md:grid-cols-2 md:text-sm">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-noir/40">
              Billed to
            </p>
            <p className="mt-2 font-medium">{order.guestName || "Guest"}</p>
            {order.guestPhone ? <p>{order.guestPhone}</p> : null}
            {order.guestEmail ? <p>{order.guestEmail}</p> : null}
            {address.payPhone ? <p>M-Pesa: {address.payPhone}</p> : null}
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-noir/40">
              Fulfilment
            </p>
            <p className="mt-2 font-medium">{fulfilmentLabel(order.addressJson)}</p>
            {address.fulfilment === "delivery" ? (
              <>
                <p>{address.line1 || order.deliveryNotes}</p>
                {address.landmark ? (
                  <p>Nearest building: {address.landmark}</p>
                ) : null}
              </>
            ) : (
              <p>
                Collect at {BRAND.address.street}, {BRAND.address.junction}.
              </p>
            )}
          </div>
        </div>

        <table className="mt-8 w-full text-left text-[12px] md:text-sm">
          <thead>
            <tr className="border-b border-noir/15 text-[10px] uppercase tracking-[0.16em] text-noir/40">
              <th className="py-2 font-normal">Item</th>
              <th className="py-2 text-right font-normal">Qty</th>
              <th className="py-2 text-right font-normal">Amount</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id} className="border-b border-noir/8">
                <td className="py-2.5">
                  {item.name}
                  {item.size ? ` · ${item.size}` : ""}
                  {item.colour ? ` · ${item.colour}` : ""}
                </td>
                <td className="py-2.5 text-right">{item.qty}</td>
                <td className="py-2.5 text-right">
                  {formatKes(item.unitKes * item.qty)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <dl className="mt-4 ml-auto max-w-xs space-y-1 text-[12px] md:text-sm">
          <div className="flex justify-between">
            <dt className="text-noir/50">Subtotal</dt>
            <dd>{formatKes(order.subtotalKes)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-noir/50">Delivery</dt>
            <dd>{formatKes(order.deliveryKes)}</dd>
          </div>
          <div className="flex justify-between border-t border-noir/15 pt-2 text-base font-medium">
            <dt>Total</dt>
            <dd>{formatKes(order.totalKes)}</dd>
          </div>
        </dl>

        {paid ? (
          <p className="mt-8 rounded-lg border border-emerald-700/20 bg-emerald-50 px-4 py-3 text-[12px] text-emerald-900 md:text-sm">
            Paid in full
            {receipt ? ` · M-Pesa receipt ${receipt}` : ""}. Thank you.
          </p>
        ) : (
          <div className="mt-8 rounded-lg border border-[#b08a3e]/40 bg-[#b08a3e]/8 px-4 py-4">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#8a6a2a]">
              Pay this invoice
            </p>
            <p className="mt-2 text-[12px] text-noir/70 md:text-sm">
              Click the link to open M-Pesa and settle {formatKes(order.totalKes)}.
            </p>
            <a
              href={payUrl}
              className="mt-3 inline-block break-all text-[12px] text-[#1d4ed8] underline md:text-sm"
            >
              {payUrl}
            </a>
          </div>
        )}

        <InvoiceActions token={token} paid={paid} />
        <p className="no-print mt-6 text-[11px] text-noir/45">
          <Link href="/" className="underline">
            Return to shop
          </Link>
        </p>
      </div>
    </div>
  );
}
