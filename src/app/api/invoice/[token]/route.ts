import { NextResponse } from "next/server";
import { loadInvoiceOrder } from "@/lib/invoice/load";
import { buildInvoicePdf } from "@/lib/invoice/pdf";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const order = await loadInvoiceOrder(token);
  if (!order) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  const bytes = await buildInvoicePdf(order);
  const paid = order.status === "PAID" || order.payments.some((p) => p.status === "PAID");
  const kind = paid ? "receipt" : "invoice";
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="ELIJAYS-${kind}-${order.number}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
