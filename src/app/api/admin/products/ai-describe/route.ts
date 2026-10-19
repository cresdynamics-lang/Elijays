import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { canAccess } from "@/lib/auth/permissions";
import { describeProductFromImage } from "@/lib/ai/product-from-image";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user || !canAccess(user.role, "products")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const form = await req.formData();
  const file = form.get("file");
  const imageUrl = String(form.get("imageUrl") || "").trim();
  const hint = String(form.get("hint") || "").trim();

  let buffer: Buffer;
  let mimeType = "image/jpeg";

  if (file instanceof File) {
    mimeType = file.type || "image/jpeg";
    buffer = Buffer.from(await file.arrayBuffer());
  } else if (imageUrl) {
    const abs = imageUrl.startsWith("http")
      ? imageUrl
      : new URL(imageUrl, req.nextUrl.origin).toString();
    const imgRes = await fetch(abs);
    if (!imgRes.ok) {
      return NextResponse.json({ error: "Could not load image" }, { status: 400 });
    }
    mimeType = imgRes.headers.get("content-type") || "image/jpeg";
    buffer = Buffer.from(await imgRes.arrayBuffer());
  } else {
    return NextResponse.json(
      { error: "Upload a product photo first" },
      { status: 400 },
    );
  }

  if (buffer.length > 8 * 1024 * 1024) {
    return NextResponse.json({ error: "Max 8MB image" }, { status: 400 });
  }

  try {
    const copy = await describeProductFromImage({
      imageBase64: buffer.toString("base64"),
      mimeType,
      hint: hint || undefined,
    });
    return NextResponse.json({ ok: true, ...copy });
  } catch (e) {
    const message = e instanceof Error ? e.message : "AI failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
