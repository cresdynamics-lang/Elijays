import { readFile } from "fs/promises";
import path from "path";

export const runtime = "nodejs";

// `next start` only serves files that were in public/ at build time, so photos
// uploaded from the admin afterwards 404. next.config.ts rewrites /uploads/* here
// as a fallback (only when the static file isn't found), and this reads them
// from disk.
const ROOT = path.join(process.cwd(), "public", "uploads");

const TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".avif": "image/avif",
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path: parts } = await params;
  const file = path.resolve(ROOT, ...parts);
  const type = TYPES[path.extname(file).toLowerCase()];
  // Refuse anything outside public/uploads (e.g. "../.env") or not an image.
  if (!file.startsWith(ROOT + path.sep) || !type) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const data = await readFile(file);
    return new Response(data, {
      headers: {
        "Content-Type": type,
        // Upload names are unique per file, so they never change in place.
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
