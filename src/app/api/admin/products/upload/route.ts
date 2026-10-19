import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import { canAccess } from "@/lib/auth/permissions";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user || !canAccess(user.role, "products")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const form = await req.formData();
  const file = form.get("file");
  const productId = String(form.get("productId") || "").trim() || null;

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file required" }, { status: 400 });
  }

  const mime = file.type || "image/jpeg";
  if (!mime.startsWith("image/")) {
    return NextResponse.json({ error: "Images only" }, { status: 400 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  if (bytes.length > 8 * 1024 * 1024) {
    return NextResponse.json({ error: "Max 8MB" }, { status: 400 });
  }

  const ext =
    mime === "image/png"
      ? "png"
      : mime === "image/webp"
        ? "webp"
        : mime === "image/gif"
          ? "gif"
          : "jpg";
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads", "products");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), bytes);

  const url = `/uploads/products/${filename}`;
  const media = await prisma.mediaAsset.create({
    data: {
      filename,
      url,
      alt: file.name || filename,
      mimeType: mime,
      bytes: bytes.length,
    },
  });

  if (productId) {
    const count = await prisma.productImage.count({
      where: { productId, deletedAt: null },
    });
    await prisma.productImage.create({
      data: {
        productId,
        mediaId: media.id,
        sortOrder: count,
      },
    });
  }

  return NextResponse.json({
    ok: true,
    mediaId: media.id,
    url: media.url,
    mimeType: mime,
  });
}
