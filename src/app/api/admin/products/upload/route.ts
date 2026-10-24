import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import sharp from "sharp";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import { userCan } from "@/lib/auth/permissions";
import { publishIfReady } from "@/lib/admin/publish";

export const runtime = "nodejs";

// Longest side kept for product photos; phone shots arrive at 3000-4000px.
const MAX_SIDE = 2000;

/**
 * Re-encode every upload so what we save is guaranteed to display: decodes the
 * image (rejecting corrupt files and formats browsers can't show, like iPhone
 * HEIC), applies the camera's rotation, and shrinks oversized photos.
 */
async function prepareImage(input: Buffer) {
  const image = sharp(input, { failOn: "error" }).rotate();
  const meta = await image.metadata();
  if (!meta.width || !meta.height) throw new Error("not an image");
  const resized = image.resize({
    width: MAX_SIDE,
    height: MAX_SIDE,
    fit: "inside",
    withoutEnlargement: true,
  });
  // Keep transparency (PNG cut-outs) as WebP; everything else as JPEG.
  if (meta.hasAlpha) {
    return { data: await resized.webp({ quality: 85 }).toBuffer(), ext: "webp", mime: "image/webp" };
  }
  return {
    data: await resized.jpeg({ quality: 82, mozjpeg: true }).toBuffer(),
    ext: "jpg",
    mime: "image/jpeg",
  };
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!userCan(user, "products") && !userCan(user, "inventory")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const form = await req.formData();
  const file = form.get("file");
  const productId = String(form.get("productId") || "").trim() || null;
  const colour = String(form.get("colour") || "").trim() || null;

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

  let prepared: Awaited<ReturnType<typeof prepareImage>>;
  try {
    prepared = await prepareImage(bytes);
  } catch {
    return NextResponse.json(
      {
        error:
          "This photo couldn't be read. Upload a JPEG, PNG or WebP (on iPhone, set Camera > Formats to Most Compatible).",
      },
      { status: 400 },
    );
  }

  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${prepared.ext}`;
  const dir = path.join(process.cwd(), "public", "uploads", "products");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), prepared.data);

  const url = `/uploads/products/${filename}`;
  const media = await prisma.mediaAsset.create({
    data: {
      filename,
      url,
      alt: colour || file.name || filename,
      mimeType: prepared.mime,
      bytes: prepared.data.length,
    },
  });

  if (productId) {
    if (colour) {
      await prisma.productImage.updateMany({
        where: { productId, colour, deletedAt: null },
        data: { deletedAt: new Date() },
      });
    }
    const count = await prisma.productImage.count({
      where: { productId, deletedAt: null },
    });
    await prisma.productImage.create({
      data: {
        productId,
        mediaId: media.id,
        colour,
        sortOrder: count,
      },
    });
    await publishIfReady(productId, user?.id);
    revalidatePath("/", "layout"); // new photo shows on the storefront
  }

  return NextResponse.json({
    ok: true,
    mediaId: media.id,
    url: media.url,
    mimeType: prepared.mime,
    colour,
  });
}
