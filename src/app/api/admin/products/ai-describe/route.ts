import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { userCan } from "@/lib/auth/permissions";
import { describeProductFromImage } from "@/lib/ai/product-from-image";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!userCan(user, "products")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const form = await req.formData();
  const file = form.get("file");
  const imageUrlRaw = String(form.get("imageUrl") || "").trim();
  const hint = String(form.get("hint") || "").trim();

  // Prefer a public HTTP URL — more reliable for Groq from the VPS.
  if (imageUrlRaw) {
    const abs = imageUrlRaw.startsWith("http")
      ? imageUrlRaw
      : new URL(imageUrlRaw, req.nextUrl.origin).toString();
    try {
      const copy = await describeProductFromImage({
        imageUrl: abs,
        hint: hint || undefined,
      });
      return NextResponse.json({ ok: true, ...copy });
    } catch (e) {
      const message = e instanceof Error ? e.message : "AI failed";
      return NextResponse.json({ error: message }, { status: 502 });
    }
  }

  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "Upload a product photo first" },
      { status: 400 },
    );
  }

  const mimeType = file.type || "image/jpeg";
  const buffer = Buffer.from(await file.arrayBuffer());
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
