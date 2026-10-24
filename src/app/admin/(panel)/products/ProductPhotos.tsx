"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { removeProductImage, setMainProductImage } from "./actions";

type Photo = { id: string; url: string; colour: string | null };

/**
 * The product's photos as shoppers see them (the first is the main photo on
 * the storefront), with add / set-main / remove, and AI copy from the main one.
 */
export function ProductPhotos({
  productId,
  photos,
}: {
  productId: string;
  photos: Photo[];
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, start] = useTransition();
  const [busy, setBusy] = useState<"" | "upload" | "ai">("");
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(
    null,
  );
  const main = photos[0];

  const fail = (e: unknown, fallback: string) =>
    setMessage({ tone: "error", text: e instanceof Error ? e.message : fallback });

  const upload = async (file: File) => {
    setMessage(null);
    setBusy("upload");
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("productId", productId);
      const res = await fetch("/api/admin/products/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Upload failed");
      setMessage({ tone: "ok", text: "Photo added." });
      router.refresh();
    } catch (e) {
      fail(e, "Upload failed");
    } finally {
      setBusy("");
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const act = (fn: () => Promise<void>, done: string) => {
    setMessage(null);
    start(async () => {
      try {
        await fn();
        setMessage({ tone: "ok", text: done });
        router.refresh();
      } catch (e) {
        fail(e, "Could not update photos");
      }
    });
  };

  // Fills the details form; nothing is saved until Save changes / Update.
  const writeWithAi = async () => {
    if (!main) return;
    setMessage(null);
    setBusy("ai");
    try {
      const fd = new FormData();
      fd.append("imageUrl", main.url);
      const res = await fetch("/api/admin/products/ai-describe", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "AI failed");
      const fields: Record<string, string> = {
        name: json.name,
        shortLine: json.shortLine,
        description: json.description,
      };
      for (const [name, value] of Object.entries(fields)) {
        const el = document.querySelector<HTMLInputElement | HTMLTextAreaElement>(
          `#product-details [name="${name}"]`,
        );
        if (el && value) el.value = value;
      }
      setMessage({ tone: "ok", text: "Name and description filled in. Review, then Save changes." });
    } catch (e) {
      fail(e, "AI failed");
    } finally {
      setBusy("");
    }
  };

  const disabled = pending || busy !== "";

  return (
    <div className="rounded-xl border border-line bg-noir-soft/40 p-5">
      <h2 className="text-xs uppercase tracking-widest text-ivory-faint">Photos</h2>
      <p className="mt-2 text-xs text-ivory-muted">
        The main photo is the one shoppers see first.
      </p>

      {photos.length === 0 ? (
        <p className="mt-4 rounded-lg border border-dashed border-line px-4 py-6 text-center text-xs text-ivory-faint">
          No photos yet — add one so the product can go live.
        </p>
      ) : (
        <ul className="mt-4 grid grid-cols-3 gap-3">
          {photos.map((photo, index) => (
            <li key={photo.id} className="space-y-1.5">
              <div
                className={`relative aspect-[3/4] overflow-hidden rounded-lg border bg-noir ${
                  index === 0 ? "border-gold/60" : "border-line"
                }`}
              >
                <Image
                  src={photo.url}
                  alt={photo.colour ?? "Product photo"}
                  fill
                  sizes="120px"
                  className="object-cover"
                  unoptimized
                />
                {index === 0 ? (
                  <span className="absolute left-1 top-1 rounded bg-gold px-1.5 py-0.5 text-[9px] uppercase tracking-widest text-noir">
                    Main
                  </span>
                ) : null}
              </div>
              {photo.colour ? (
                <p className="truncate text-[10px] text-ivory-faint">{photo.colour}</p>
              ) : null}
              <div className="flex flex-wrap gap-x-2 gap-y-1">
                {index > 0 ? (
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() =>
                      act(() => setMainProductImage(productId, photo.id), "Main photo updated.")
                    }
                    className="text-[10px] uppercase tracking-widest text-gold hover:underline disabled:opacity-40"
                  >
                    Make main
                  </button>
                ) : null}
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    if (window.confirm("Remove this photo from the product?")) {
                      act(() => removeProductImage(productId, photo.id), "Photo removed.");
                    }
                  }}
                  className="text-[10px] uppercase tracking-widest text-ivory-faint hover:text-red-300 disabled:opacity-40"
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <label
          className={`cursor-pointer rounded-full border border-gold/40 bg-gold/10 px-4 py-2 text-[10px] uppercase tracking-widest text-gold ${
            disabled ? "pointer-events-none opacity-50" : ""
          }`}
        >
          {busy === "upload" ? "Uploading…" : "Add photo"}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void upload(f);
            }}
          />
        </label>
        {main ? (
          <button
            type="button"
            disabled={disabled}
            onClick={() => void writeWithAi()}
            className="rounded-full border border-line px-4 py-2 text-[10px] uppercase tracking-widest text-ivory-muted hover:text-gold disabled:opacity-50"
          >
            {busy === "ai" ? "Writing…" : "Write name & description with AI"}
          </button>
        ) : null}
      </div>

      {message ? (
        <p
          role={message.tone === "error" ? "alert" : "status"}
          className={`mt-3 text-xs ${message.tone === "error" ? "text-red-300" : "text-emerald-300"}`}
        >
          {message.text}
        </p>
      ) : null}
    </div>
  );
}
