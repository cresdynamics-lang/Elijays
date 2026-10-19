"use client";

import { useRef, useState } from "react";
import Image from "next/image";

type Result = {
  name: string;
  shortLine: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
};

/** Drop onto product edit forms — fills named inputs after AI reads the photo. */
export function ProductAiAssist({ productId }: { productId: string }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [error, setError] = useState("");

  const applyToForm = (copy: Result) => {
    const set = (name: string, value: string) => {
      const el = document.querySelector<
        HTMLInputElement | HTMLTextAreaElement
      >(`form [name="${name}"]`);
      if (el) {
        el.value = value;
        el.dispatchEvent(new Event("input", { bubbles: true }));
      }
    };
    set("name", copy.name);
    set("shortLine", copy.shortLine);
    set("description", copy.description);
  };

  const run = async (file: File) => {
    setError("");
    setStatus("busy");
    setPreview(URL.createObjectURL(file));
    try {
      const upFd = new FormData();
      upFd.append("file", file);
      upFd.append("productId", productId);
      const up = await fetch("/api/admin/products/upload", {
        method: "POST",
        body: upFd,
      });
      const upJson = await up.json();
      if (!up.ok) throw new Error(upJson.error || "Upload failed");

      const aiFd = new FormData();
      aiFd.append("file", file);
      const ai = await fetch("/api/admin/products/ai-describe", {
        method: "POST",
        body: aiFd,
      });
      const aiJson = await ai.json();
      if (!ai.ok) throw new Error(aiJson.error || "AI failed");
      applyToForm(aiJson);
      setStatus("done");
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : "Failed");
    }
  };

  return (
    <div className="rounded-xl border border-line bg-noir-soft/40 p-5">
      <h2 className="text-xs uppercase tracking-widest text-ivory-faint">
        AI from photo
      </h2>
      <p className="mt-2 text-xs text-ivory-muted">
        Upload a product image — AI names it and writes SEO-focused copy you can
        edit before saving.
      </p>
      <div className="mt-4 flex gap-4">
        <div className="relative h-28 w-20 overflow-hidden rounded-lg border border-line bg-noir">
          {preview ? (
            <Image src={preview} alt="" fill className="object-cover" unoptimized />
          ) : null}
        </div>
        <div className="flex-1 space-y-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="block w-full text-xs text-ivory-muted file:mr-2 file:rounded-full file:border-0 file:bg-gold/15 file:px-3 file:py-1.5 file:text-[10px] file:uppercase file:tracking-widest file:text-gold"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void run(f);
            }}
          />
          <p className="text-[11px] text-ivory-faint">
            {status === "busy"
              ? "Reading image…"
              : status === "done"
                ? "Fields updated — review and save."
                : status === "error"
                  ? error
                  : "Uses OPENAI_API_KEY on the server."}
          </p>
        </div>
      </div>
    </div>
  );
}
