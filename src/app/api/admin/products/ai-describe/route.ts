import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { userCan } from "@/lib/auth/permissions";
import { describeProductFromImage } from "@/lib/ai/product-from-image";
import { SITE_URL } from "@/lib/constants";
import { readFile, stat } from "fs/promises";
import path from "path";

export const runtime = "nodejs";
export const maxDuration = 60;

// Groq rejects inline (base64) images much over 4MB once encoded.
const MAX_INLINE_BYTES = 3 * 1024 * 1024;

/**
 * Our own uploads are read from disk and sent inline, so Groq never has to
 * download them from the site (behind the proxy, the request origin is the
 * internal address). Larger photos go by their public https URL instead.
 */
async function imageForGroq(
  imageUrl: string,
): Promise<{ imageUrl: string } | { imageBase64: string; mimeType: string }> {
  if (imageUrl.startsWith("http")) return { imageUrl };

  const uploadsRoot = path.join(process.cwd(), "public", "uploads");
  const file = path.resolve(process.cwd(), "public", `.${imageUrl}`);
  if (file.startsWith(uploadsRoot + path.sep)) {
    try {
      const info = await stat(file);
      if (info.size <= MAX_INLINE_BYTES) {
        const ext = path.extname(file).toLowerCase();
        const mimeType =
          ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : "image/jpeg";
        return { imageBase64: (await readFile(file)).toString("base64"), mimeType };
      }
    } catch {
      // Not on disk: fall through to the public URL.
    }
  }
  return { imageUrl: new URL(imageUrl, SITE_URL).toString() };
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!userCan(user, "products")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const form = await req.formData();
  const file = form.get("file");
  const imageUrlRaw = String(form.get("imageUrl") || "").trim();
  const hint = String(form.get("hint") || "").trim();

  if (imageUrlRaw) {
    try {
      const copy = await describeProductFromImage({
        ...(await imageForGroq(imageUrlRaw)),
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
