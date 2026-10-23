import {
  PDFDocument,
  PDFString,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFPage,
} from "pdf-lib";
import { BRAND, SITE_URL, formatKes } from "@/lib/constants";
import { fulfilmentLabel, parseAddressJson } from "@/lib/orders/fulfilment";

export type InvoiceOrder = {
  number: number;
  createdAt: Date;
  status: string;
  guestName: string | null;
  guestPhone: string | null;
  guestEmail: string | null;
  deliveryNotes: string | null;
  addressJson: unknown;
  subtotalKes: number;
  deliveryKes: number;
  totalKes: number;
  checkoutToken: string | null;
  items: {
    name: string;
    size: string | null;
    colour: string | null;
    qty: number;
    unitKes: number;
  }[];
  payments: {
    status: string;
    mpesaReceipt: string | null;
    amountKes: number;
  }[];
};

const ink = rgb(0.08, 0.08, 0.08);
const muted = rgb(0.38, 0.38, 0.38);
const gold = rgb(0.55, 0.44, 0.22);
const line = rgb(0.82, 0.78, 0.7);

function wrap(font: PDFFont, text: string, size: number, maxWidth: number) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) <= maxWidth) {
      current = next;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [""];
}

function addLink(page: PDFPage, x: number, y: number, w: number, h: number, url: string) {
  const annot = page.doc.context.register(
    page.doc.context.obj({
      Type: "Annot",
      Subtype: "Link",
      Rect: [x, y, x + w, y + h],
      Border: [0, 0, 0],
      A: {
        Type: "Action",
        S: "URI",
        URI: PDFString.of(url),
      },
    }),
  );
  page.node.addAnnot(annot);
}

export async function buildInvoicePdf(order: InvoiceOrder): Promise<Uint8Array> {
  const paid =
    order.status === "PAID" || order.payments.some((p) => p.status === "PAID");
  const receipt = order.payments.find((p) => p.mpesaReceipt)?.mpesaReceipt;
  const address = parseAddressJson(order.addressJson);
  const payUrl = order.checkoutToken
    ? `${SITE_URL}/pay/${order.checkoutToken}`
    : `${SITE_URL}/checkout`;
  const title = paid ? "RECEIPT" : "INVOICE";

  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595.28, 841.89]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const { width, height } = page.getSize();
  const left = 48;
  const right = width - 48;
  let y = height - 56;

  page.drawText(BRAND.name, { x: left, y, size: 22, font: bold, color: gold });
  page.drawText(title, {
    x: right - bold.widthOfTextAtSize(title, 14),
    y: y + 4,
    size: 14,
    font: bold,
    color: ink,
  });
  y -= 18;
  page.drawText(BRAND.fullName, { x: left, y, size: 10, font, color: muted });
  y -= 14;
  page.drawText(
    `${BRAND.address.street} · ${BRAND.address.junction}`,
    { x: left, y, size: 9, font, color: muted },
  );
  y -= 12;
  page.drawText(`${BRAND.phone} · ${BRAND.email}`, {
    x: left,
    y,
    size: 9,
    font,
    color: muted,
  });
  y -= 22;
  page.drawLine({
    start: { x: left, y },
    end: { x: right, y },
    thickness: 0.6,
    color: line,
  });
  y -= 22;

  const meta = [
    [`${title} No.`, `#${order.number}`],
    ["Date", order.createdAt.toLocaleDateString("en-KE", { dateStyle: "medium" })],
    ["Status", paid ? "PAID" : "AMOUNT DUE"],
  ];
  if (receipt) meta.push(["M-Pesa receipt", receipt]);
  for (const [k, v] of meta) {
    page.drawText(k, { x: left, y, size: 9, font, color: muted });
    page.drawText(v, { x: left + 120, y, size: 9, font: bold, color: ink });
    y -= 14;
  }

  y -= 10;
  page.drawText("Billed to", { x: left, y, size: 8, font: bold, color: gold });
  y -= 14;
  page.drawText(order.guestName || "Guest", {
    x: left,
    y,
    size: 11,
    font: bold,
    color: ink,
  });
  y -= 13;
  if (order.guestPhone) {
    page.drawText(order.guestPhone, { x: left, y, size: 9, font, color: muted });
    y -= 12;
  }
  if (order.guestEmail) {
    page.drawText(order.guestEmail, { x: left, y, size: 9, font, color: muted });
    y -= 12;
  }
  if (address.payPhone) {
    page.drawText(`M-Pesa: ${address.payPhone}`, {
      x: left,
      y,
      size: 9,
      font,
      color: muted,
    });
    y -= 12;
  }

  y -= 6;
  page.drawText("Fulfilment", { x: left, y, size: 8, font: bold, color: gold });
  y -= 14;
  page.drawText(fulfilmentLabel(order.addressJson), {
    x: left,
    y,
    size: 10,
    font: bold,
    color: ink,
  });
  y -= 13;
  const fulfilmentLines =
    address.fulfilment === "delivery"
      ? [
          address.line1 || order.deliveryNotes || "",
          address.landmark ? `Nearest building: ${address.landmark}` : "",
        ]
      : [
          `Collect at ${BRAND.address.street}`,
          `${BRAND.address.junction}, ${BRAND.address.city}`,
        ];
  for (const lineText of fulfilmentLines.filter(Boolean)) {
    for (const wrapped of wrap(font, lineText, 9, right - left)) {
      page.drawText(wrapped, { x: left, y, size: 9, font, color: muted });
      y -= 12;
    }
  }

  y -= 10;
  page.drawLine({
    start: { x: left, y },
    end: { x: right, y },
    thickness: 0.6,
    color: line,
  });
  y -= 18;
  page.drawText("Item", { x: left, y, size: 8, font: bold, color: muted });
  page.drawText("Qty", { x: 360, y, size: 8, font: bold, color: muted });
  page.drawText("Amount", {
    x: right - bold.widthOfTextAtSize("Amount", 8),
    y,
    size: 8,
    font: bold,
    color: muted,
  });
  y -= 12;

  for (const item of order.items) {
    const label = [
      item.name,
      item.size,
      item.colour,
    ]
      .filter(Boolean)
      .join(" · ");
    const nameLines = wrap(font, label, 9, 300);
    const amount = formatKes(item.unitKes * item.qty);
    page.drawText(String(item.qty), { x: 360, y, size: 9, font, color: ink });
    page.drawText(amount, {
      x: right - font.widthOfTextAtSize(amount, 9),
      y,
      size: 9,
      font,
      color: ink,
    });
    for (const nameLine of nameLines) {
      page.drawText(nameLine, { x: left, y, size: 9, font, color: ink });
      y -= 12;
    }
    y -= 4;
  }

  y -= 6;
  page.drawLine({
    start: { x: 320, y },
    end: { x: right, y },
    thickness: 0.6,
    color: line,
  });
  y -= 16;
  const totals: [string, string, boolean][] = [
    ["Subtotal", formatKes(order.subtotalKes), false],
    ["Delivery", formatKes(order.deliveryKes), false],
    ["Total", formatKes(order.totalKes), true],
  ];
  for (const [k, v, strong] of totals) {
    const f = strong ? bold : font;
    const size = strong ? 12 : 9;
    page.drawText(k, { x: 320, y, size, font: f, color: strong ? ink : muted });
    page.drawText(v, {
      x: right - f.widthOfTextAtSize(v, size),
      y,
      size,
      font: f,
      color: ink,
    });
    y -= strong ? 20 : 14;
  }

  y -= 8;
  if (!paid) {
    page.drawRectangle({
      x: left,
      y: y - 58,
      width: right - left,
      height: 70,
      borderColor: gold,
      borderWidth: 1,
    });
    page.drawText("Pay this invoice", {
      x: left + 14,
      y: y,
      size: 10,
      font: bold,
      color: gold,
    });
    y -= 16;
    page.drawText("Click the link below to open M-Pesa and settle this order.", {
      x: left + 14,
      y,
      size: 8,
      font,
      color: muted,
    });
    y -= 16;
    page.drawText(payUrl, {
      x: left + 14,
      y,
      size: 9,
      font,
      color: rgb(0.12, 0.28, 0.62),
    });
    addLink(page, left + 12, y - 4, right - left - 24, 16, payUrl);
  } else {
    page.drawText(
      receipt
        ? `Paid in full. M-Pesa receipt ${receipt}.`
        : "Paid in full. Thank you.",
      { x: left, y, size: 10, font: bold, color: ink },
    );
  }

  page.drawText("ELIJAYS Men's Wear · Nairobi", {
    x: left,
    y: 36,
    size: 8,
    font,
    color: muted,
  });

  return pdf.save();
}
