"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { autosaveProduct, publishProduct } from "./actions";
import { whatsappProductUpdateUrl } from "@/lib/constants";

type Cat = { id: string; name: string };

export function ProductComposer({ categories }: { categories: Cat[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [productId, setProductId] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [aiStatus, setAiStatus] = useState<"idle" | "uploading" | "reading" | "done" | "error">(
    "idle",
  );
  const [aiError, setAiError] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    name: "",
    sku: "",
    categoryId: "",
    priceKes: "",
    shortLine: "",
    description: "",
    seoTitle: "",
    seoDescription: "",
  });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Saves run from timers and async upload/AI callbacks that hold stale
  // renders, so the product id lives in a ref, and the first save's create is
  // shared: saves that start while it's in flight wait for its id instead of
  // each creating another product.
  const idRef = useRef<string | null>(null);
  const creating = useRef<Promise<string> | null>(null);

  const save = useCallback(
    async (next = form, publish = false) => {
      if (!next.name.trim() && !next.sku.trim()) return idRef.current;
      setStatus("saving");
      try {
        if (!idRef.current && creating.current) await creating.current;
        const fields = {
          name: next.name || "Untitled product",
          sku: next.sku,
          categoryId: next.categoryId || null,
          priceKes: Number(next.priceKes) || 0,
          shortLine: next.shortLine,
          description: next.description,
          seoTitle: next.seoTitle,
          seoDescription: next.seoDescription,
          publish,
        };
        let id = idRef.current;
        if (id) {
          await autosaveProduct({ id, ...fields });
        } else {
          creating.current = autosaveProduct({ id: null, ...fields }).then(
            (res) => res.id as string,
          );
          try {
            id = await creating.current;
          } finally {
            creating.current = null;
          }
          idRef.current = id;
          setProductId(id);
        }
        setStatus("saved");
        if (publish) router.push(`/admin/products/${id}`);
        return id;
      } catch {
        setStatus("error");
        return idRef.current;
      }
    },
    [form, router],
  );

  const onChange = (key: keyof typeof form, value: string) => {
    const next = { ...form, [key]: value };
    setForm(next);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      start(() => {
        void save(next, false);
      });
    }, 600);
  };

  useEffect(() => {
    const flush = () => {
      if (form.name.trim() || form.sku.trim()) {
        void autosaveProduct({
          id: idRef.current,
          name: form.name || "Untitled product",
          sku: form.sku,
          categoryId: form.categoryId || null,
          priceKes: Number(form.priceKes) || 0,
          shortLine: form.shortLine,
          description: form.description,
          seoTitle: form.seoTitle,
          seoDescription: form.seoDescription,
          publish: false,
        });
      }
    };
    window.addEventListener("pagehide", flush);
    return () => {
      window.removeEventListener("pagehide", flush);
      if (timer.current) clearTimeout(timer.current);
    };
  }, [form]);

  const findCategoryId = (suggested?: string) => {
    if (!suggested) return "";
    const hit = categories.find(
      (c) =>
        c.name.toLowerCase() === suggested.toLowerCase() ||
        c.name.toLowerCase().includes(suggested.toLowerCase()) ||
        suggested.toLowerCase().includes(c.name.toLowerCase()),
    );
    return hit?.id || "";
  };

  const onFile = async (file: File | null) => {
    if (!file) return;
    setAiError("");
    setAiStatus("uploading");
    const local = URL.createObjectURL(file);
    setPreviewUrl(local);

    try {
      // Ensure draft exists so we can attach the image
      let id = idRef.current;
      if (!id) {
        id =
          (await save(
            {
              ...form,
              name: form.name || "Untitled product",
            },
            false,
          )) || null;
      }

      const fd = new FormData();
      fd.append("file", file);
      if (id) fd.append("productId", id);

      const up = await fetch("/api/admin/products/upload", {
        method: "POST",
        body: fd,
      });
      const upJson = await up.json();
      if (!up.ok) throw new Error(upJson.error || "Upload failed");
      setUploadedUrl(upJson.url);

      setAiStatus("reading");
      const aiFd = new FormData();
      // Prefer public URL so Groq can fetch the image from the VPS reliably
      if (upJson.url) aiFd.append("imageUrl", upJson.url);
      else aiFd.append("file", file);
      if (form.name) aiFd.append("hint", form.name);
      const ai = await fetch("/api/admin/products/ai-describe", {
        method: "POST",
        body: aiFd,
      });
      const aiJson = await ai.json();
      if (!ai.ok) throw new Error(aiJson.error || "AI failed");

      const catId = findCategoryId(aiJson.suggestedCategory) || form.categoryId;
      const next = {
        ...form,
        name: aiJson.name || form.name,
        shortLine: aiJson.shortLine || form.shortLine,
        description: aiJson.description || form.description,
        seoTitle: aiJson.seoTitle || form.seoTitle,
        seoDescription: aiJson.seoDescription || form.seoDescription,
        categoryId: catId,
      };
      setForm(next);
      setAiStatus("done");
      start(() => {
        void save(next, false);
      });
    } catch (e) {
      setAiStatus("error");
      setAiError(e instanceof Error ? e.message : "Could not read product");
    }
  };

  const regenerate = async () => {
    if (!uploadedUrl && !fileRef.current?.files?.[0]) {
      setAiError("Upload a product photo first");
      setAiStatus("error");
      return;
    }
    setAiError("");
    setAiStatus("reading");
    try {
      const aiFd = new FormData();
      const file = fileRef.current?.files?.[0];
      if (file) aiFd.append("file", file);
      else if (uploadedUrl) aiFd.append("imageUrl", uploadedUrl);
      if (form.name) aiFd.append("hint", form.name);
      const ai = await fetch("/api/admin/products/ai-describe", {
        method: "POST",
        body: aiFd,
      });
      const aiJson = await ai.json();
      if (!ai.ok) throw new Error(aiJson.error || "AI failed");
      const catId = findCategoryId(aiJson.suggestedCategory) || form.categoryId;
      const next = {
        ...form,
        name: aiJson.name || form.name,
        shortLine: aiJson.shortLine || form.shortLine,
        description: aiJson.description || form.description,
        seoTitle: aiJson.seoTitle || form.seoTitle,
        seoDescription: aiJson.seoDescription || form.seoDescription,
        categoryId: catId,
      };
      setForm(next);
      setAiStatus("done");
      start(() => {
        void save(next, false);
      });
    } catch (e) {
      setAiStatus("error");
      setAiError(e instanceof Error ? e.message : "AI failed");
    }
  };

  return (
    <div className="max-w-2xl space-y-4 rounded-xl border border-line bg-noir-soft/40 p-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-ivory-faint">
          {status === "saving"
            ? "Saving…"
            : status === "saved"
              ? productId
                ? "Saved — goes live once it has a name, price, category and photo"
                : "Saved"
              : status === "error"
                ? "Could not save"
                : "Upload a photo — AI names and describes it for the storefront"}
        </p>
        {productId ? (
          <span className="text-[10px] uppercase tracking-widest text-gold/80">
            In progress
          </span>
        ) : null}
      </div>

      <div className="rounded-xl border border-dashed border-line bg-noir/60 p-4">
        <p className="text-[11px] uppercase tracking-widest text-ivory-faint">
          Product photo · AI read
        </p>
        <div className="mt-3 flex flex-wrap items-start gap-4">
          <div className="relative h-36 w-28 overflow-hidden rounded-lg border border-line bg-noir">
            {previewUrl || uploadedUrl ? (
              <Image
                src={previewUrl || uploadedUrl || ""}
                alt="Product"
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="flex h-full items-center justify-center px-2 text-center text-[10px] text-ivory-faint">
                No image
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="block w-full text-xs text-ivory-muted file:mr-3 file:rounded-full file:border-0 file:bg-gold/15 file:px-4 file:py-2 file:text-[10px] file:uppercase file:tracking-widest file:text-gold"
              onChange={(e) => void onFile(e.target.files?.[0] || null)}
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void regenerate()}
                disabled={aiStatus === "reading" || aiStatus === "uploading"}
                className="rounded-full border border-gold/40 px-4 py-1.5 text-[10px] uppercase tracking-widest text-gold disabled:opacity-40"
              >
                {aiStatus === "reading"
                  ? "AI reading…"
                  : aiStatus === "uploading"
                    ? "Uploading…"
                    : "Regenerate with AI"}
              </button>
            </div>
            <p className="text-[11px] text-ivory-faint">
              {aiStatus === "done"
                ? "AI filled name, short line, description, and SEO — edit freely."
                : aiStatus === "error"
                  ? aiError
                  : "AI writes a name and description shoppers recognise as the piece they want."}
            </p>
          </div>
        </div>
      </div>

      <Field
        label="Name"
        value={form.name}
        onChange={(v) => onChange("name", v)}
      />
      <Field
        label="SKU"
        value={form.sku}
        onChange={(v) => onChange("sku", v)}
      />
      <label className="block text-sm">
        <span className="text-[11px] uppercase tracking-widest text-ivory-faint">
          Category
        </span>
        <select
          value={form.categoryId}
          onChange={(e) => onChange("categoryId", e.target.value)}
          className="mt-1 w-full rounded-lg border border-line bg-noir px-3 py-2 text-ivory"
        >
          <option value="">Select category</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>
      <Field
        label="Price (KES)"
        value={form.priceKes}
        type="number"
        onChange={(v) => onChange("priceKes", v)}
      />
      <Field
        label="Short line"
        value={form.shortLine}
        onChange={(v) => onChange("shortLine", v)}
      />
      <label className="block text-sm">
        <span className="text-[11px] uppercase tracking-widest text-ivory-faint">
          Description
        </span>
        <textarea
          rows={5}
          value={form.description}
          onChange={(e) => onChange("description", e.target.value)}
          className="mt-1 w-full rounded-lg border border-line bg-noir px-3 py-2 text-sm text-ivory"
        />
      </label>
      <Field
        label="SEO title"
        value={form.seoTitle}
        onChange={(v) => onChange("seoTitle", v)}
      />
      <label className="block text-sm">
        <span className="text-[11px] uppercase tracking-widest text-ivory-faint">
          SEO description
        </span>
        <textarea
          rows={2}
          value={form.seoDescription}
          onChange={(e) => onChange("seoDescription", e.target.value)}
          className="mt-1 w-full rounded-lg border border-line bg-noir px-3 py-2 text-sm text-ivory"
        />
      </label>

      {productId ? (
        <a
          href={`/admin/products/${productId}#stock`}
          className="block text-xs uppercase tracking-widest text-gold hover:underline"
        >
          Add colours, sizes and stock →
        </a>
      ) : null}

      <div className="flex flex-wrap gap-2 pt-2">
        <button
          type="button"
          disabled={pending || !form.name.trim()}
          onClick={() =>
            start(async () => {
              if (productId) {
                await publishProduct(productId);
                router.push(`/admin/products/${productId}`);
              } else {
                await save(form, true);
              }
            })
          }
          className="rounded-full border border-gold/40 bg-gold/10 px-6 py-2 text-xs uppercase tracking-widest text-gold disabled:opacity-40"
        >
          Publish to site
        </button>
        <button
          type="button"
          disabled={!form.name.trim()}
          onClick={() => {
            window.open(
              whatsappProductUpdateUrl({
                name: form.name,
                sku: form.sku,
                shortLine: form.shortLine,
                priceKes: form.priceKes,
              }),
              "_blank",
              "noopener,noreferrer",
            );
          }}
          className="rounded-full border border-line px-6 py-2 text-xs uppercase tracking-widest text-ivory-muted hover:text-gold"
        >
          Test on WhatsApp
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="text-[11px] uppercase tracking-widest text-ivory-faint">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-line bg-noir px-3 py-2 text-ivory"
      />
    </label>
  );
}
