"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { autosaveProduct, publishProduct } from "./actions";

type Cat = { id: string; name: string };

export function ProductComposer({ categories }: { categories: Cat[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [productId, setProductId] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [form, setForm] = useState({
    name: "",
    sku: "",
    categoryId: "",
    priceKes: "",
    shortLine: "",
    description: "",
  });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const save = useCallback(
    async (next = form, publish = false) => {
      if (!next.name.trim() && !next.sku.trim()) return;
      setStatus("saving");
      try {
        const res = await autosaveProduct({
          id: productId,
          name: next.name || "Untitled product",
          sku: next.sku,
          categoryId: next.categoryId || null,
          priceKes: Number(next.priceKes) || 0,
          shortLine: next.shortLine,
          description: next.description,
          publish,
        });
        if (res.id && !productId) setProductId(res.id);
        setStatus("saved");
        if (publish && res.id) {
          router.push(`/admin/products/${res.id}`);
        }
      } catch {
        setStatus("error");
      }
    },
    [form, productId, router],
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
          id: productId,
          name: form.name || "Untitled product",
          sku: form.sku,
          categoryId: form.categoryId || null,
          priceKes: Number(form.priceKes) || 0,
          shortLine: form.shortLine,
          description: form.description,
          publish: false,
        });
      }
    };
    window.addEventListener("pagehide", flush);
    return () => {
      window.removeEventListener("pagehide", flush);
      if (timer.current) clearTimeout(timer.current);
    };
  }, [form, productId]);

  return (
    <div className="max-w-2xl space-y-4 rounded-xl border border-line bg-noir-soft/40 p-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-ivory-faint">
          {status === "saving"
            ? "Saving…"
            : status === "saved"
              ? productId
                ? "Saved — stays as in-progress until you publish"
                : "Saved"
              : status === "error"
                ? "Could not save"
                : "Starts saving as soon as you type"}
        </p>
        {productId ? (
          <span className="text-[10px] uppercase tracking-widest text-gold/80">
            In progress
          </span>
        ) : null}
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
          rows={4}
          value={form.description}
          onChange={(e) => onChange("description", e.target.value)}
          className="mt-1 w-full rounded-lg border border-line bg-noir px-3 py-2 text-sm text-ivory"
        />
      </label>

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
