"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { saveProductStock } from "./actions";

export type StockEditorColour = {
  name: string;
  imageUrl: string | null;
};

const PRESET_SIZES = ["S", "M", "L", "XL", "XXL"];

let colourSeq = 0;
function nextColourKey(prefix: string) {
  colourSeq += 1;
  return `${prefix}-${colourSeq}`;
}

export function ProductStockEditor({
  productId,
  colours: initialColours,
  sizes: initialSizes,
  quantities: initialQuantities,
  alertAt: initialAlertAt,
}: {
  productId: string;
  colours: StockEditorColour[];
  sizes: string[];
  quantities: { colour: string; size: string; quantity: number }[];
  alertAt: number;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [error, setError] = useState("");
  const [alertAt, setAlertAt] = useState(initialAlertAt);
  const [colours, setColours] = useState(() =>
    (initialColours.length ? initialColours : [{ name: "", imageUrl: null }]).map(
      (c, i) => ({
        key: `colour-${i}-${c.name}`,
        name: c.name,
        imageUrl: c.imageUrl,
        uploading: false,
      }),
    ),
  );
  const [sizes, setSizes] = useState(() =>
    initialSizes.length ? initialSizes : [...PRESET_SIZES],
  );
  const [customSize, setCustomSize] = useState("");
  const [qty, setQty] = useState<Record<string, number>>(() => {
    const next: Record<string, number> = {};
    for (const row of initialQuantities) {
      next[`${row.colour}::${row.size}`] = row.quantity;
    }
    return next;
  });

  useEffect(() => {
    if (window.location.hash !== "#stock") return;
    document.getElementById("stock")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const qtyKey = (colourName: string, size: string) => `${colourName}::${size}`;

  const unusedPresets = useMemo(
    () => PRESET_SIZES.filter((s) => !sizes.includes(s)),
    [sizes],
  );

  const setQuantity = (colourName: string, size: string, value: number) => {
    setQty((prev) => ({ ...prev, [qtyKey(colourName, size)]: Math.max(0, value) }));
    setStatus("idle");
  };

  const addColour = () => {
    setColours((prev) => [
      ...prev,
      { key: nextColourKey("new"), name: "", imageUrl: null, uploading: false },
    ]);
    setStatus("idle");
  };

  const removeColour = (key: string) => {
    setColours((prev) =>
      prev.length === 1 ? prev : prev.filter((c) => c.key !== key),
    );
    setStatus("idle");
  };

  const renameColour = (key: string, name: string) => {
    setColours((prev) => {
      const current = prev.find((c) => c.key === key);
      if (!current) return prev;
      const next = prev.map((c) => (c.key === key ? { ...c, name } : c));
      if (current.name) {
        setQty((q) => {
          const moved = { ...q };
          for (const size of sizes) {
            const from = qtyKey(current.name, size);
            const to = qtyKey(name, size);
            if (from in moved && from !== to) {
              moved[to] = moved[from];
              delete moved[from];
            }
          }
          return moved;
        });
      }
      return next;
    });
    setStatus("idle");
  };

  const addSize = (size: string) => {
    const next = size.trim().toUpperCase();
    if (!next || sizes.includes(next)) return;
    setSizes((prev) => [...prev, next]);
    setCustomSize("");
    setStatus("idle");
  };

  const removeSize = (size: string) => {
    if (sizes.length === 1) return;
    setSizes((prev) => prev.filter((s) => s !== size));
    setStatus("idle");
  };

  const uploadColour = async (key: string, file: File | null) => {
    if (!file) return;
    const colour = colours.find((c) => c.key === key);
    if (!colour?.name.trim()) {
      setError("Name the colour before uploading its photo");
      setStatus("error");
      return;
    }
    setColours((prev) =>
      prev.map((c) => (c.key === key ? { ...c, uploading: true } : c)),
    );
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("productId", productId);
      fd.append("colour", colour.name.trim());
      const res = await fetch("/api/admin/products/upload", {
        method: "POST",
        body: fd,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Upload failed");
      setColours((prev) =>
        prev.map((c) =>
          c.key === key ? { ...c, imageUrl: json.url, uploading: false } : c,
        ),
      );
      setStatus("idle");
      setError("");
    } catch (e) {
      setColours((prev) =>
        prev.map((c) => (c.key === key ? { ...c, uploading: false } : c)),
      );
      setError(e instanceof Error ? e.message : "Upload failed");
      setStatus("error");
    }
  };

  const onSave = () => {
    setError("");
    start(async () => {
      try {
        const named = colours
          .map((c) => ({ name: c.name.trim(), imageUrl: c.imageUrl }))
          .filter((c) => c.name);
        if (named.length === 0 || sizes.length === 0) {
          throw new Error("Add at least one colour and one size");
        }
        await saveProductStock(productId, {
          colours: named,
          sizes,
          alertAt,
          quantities: named.flatMap((c) =>
            sizes.map((size) => ({
              colour: c.name,
              size,
              quantity: qty[qtyKey(c.name, size)] ?? 0,
            })),
          ),
        });
        setStatus("saved");
        router.refresh();
      } catch (e) {
        setStatus("error");
        setError(e instanceof Error ? e.message : "Could not save stock");
      }
    });
  };

  return (
    <section
      id="stock"
      className="scroll-mt-28 space-y-6 rounded-xl border border-line bg-noir-soft/40 p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xs uppercase tracking-widest text-ivory-faint">
            Colours, sizes and stock
          </h2>
          <p className="mt-1 text-sm text-ivory-muted">
            Upload a photo per colour. Stock is counted per size for each colour.
          </p>
        </div>
        <label className="text-sm">
          <span className="text-[11px] uppercase tracking-widest text-ivory-faint">
            Low-stock alert at
          </span>
          <input
            type="number"
            min={0}
            value={alertAt}
            onChange={(e) => {
              setAlertAt(Math.max(0, Number(e.target.value) || 0));
              setStatus("idle");
            }}
            className="mt-1 w-24 rounded-lg border border-line bg-noir px-3 py-2 text-ivory"
          />
        </label>
      </div>

      <div>
        <p className="mb-3 text-[11px] uppercase tracking-widest text-ivory-faint">
          Colours
        </p>
        <ul className="space-y-3">
          {colours.map((colour) => (
            <li
              key={colour.key}
              className="flex flex-wrap items-center gap-3 rounded-lg border border-line bg-noir/50 p-3"
            >
              <div className="relative h-16 w-12 overflow-hidden rounded-md border border-line bg-noir">
                {colour.imageUrl ? (
                  <Image
                    src={colour.imageUrl}
                    alt={colour.name || "Colour"}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <span className="flex h-full items-center justify-center px-1 text-center text-[9px] uppercase tracking-widest text-ivory-faint">
                    Photo
                  </span>
                )}
              </div>
              <input
                value={colour.name}
                onChange={(e) => renameColour(colour.key, e.target.value)}
                placeholder="Navy"
                className="min-w-[8rem] flex-1 rounded-lg border border-line bg-noir px-3 py-2 text-sm text-ivory"
              />
              <label className="cursor-pointer rounded-full border border-line px-3 py-1.5 text-[10px] uppercase tracking-widest text-ivory-muted hover:text-gold">
                {colour.uploading ? "Uploading…" : "Upload photo"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    void uploadColour(colour.key, e.target.files?.[0] || null);
                    e.target.value = "";
                  }}
                />
              </label>
              <button
                type="button"
                onClick={() => removeColour(colour.key)}
                disabled={colours.length === 1}
                className="text-[10px] uppercase tracking-widest text-ivory-faint hover:text-red-300 disabled:opacity-30"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={addColour}
          className="mt-3 text-xs uppercase tracking-widest text-gold hover:underline"
        >
          + Add colour
        </button>
      </div>

      <div>
        <p className="mb-3 text-[11px] uppercase tracking-widest text-ivory-faint">
          Sizes
        </p>
        <div className="flex flex-wrap gap-2">
          {sizes.map((size) => (
            <span
              key={size}
              className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-3 py-1.5 text-xs text-gold"
            >
              {size}
              <button
                type="button"
                onClick={() => removeSize(size)}
                disabled={sizes.length === 1}
                className="text-gold/70 hover:text-ivory disabled:opacity-30"
                aria-label={`Remove size ${size}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {unusedPresets.map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => addSize(size)}
              className="rounded-full border border-line px-3 py-1.5 text-[10px] uppercase tracking-widest text-ivory-muted hover:text-gold"
            >
              + {size}
            </button>
          ))}
          <input
            value={customSize}
            onChange={(e) => setCustomSize(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addSize(customSize);
              }
            }}
            placeholder="Custom size"
            className="w-28 rounded-lg border border-line bg-noir px-3 py-1.5 text-sm text-ivory"
          />
          <button
            type="button"
            onClick={() => addSize(customSize)}
            className="text-[10px] uppercase tracking-widest text-gold"
          >
            Add
          </button>
        </div>
      </div>

      <div>
        <p className="mb-3 text-[11px] uppercase tracking-widest text-ivory-faint">
          Stock by size
        </p>
        <div className="overflow-x-auto rounded-lg border border-line">
          <table className="w-full min-w-[480px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-line text-[11px] uppercase tracking-widest text-ivory-faint">
                <th className="px-3 py-2 font-medium">Colour</th>
                {sizes.map((size) => (
                  <th key={size} className="px-3 py-2 font-medium">
                    {size}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              {colours.map((colour) => (
                <tr key={colour.key}>
                  <td className="px-3 py-2 text-ivory">
                    {colour.name.trim() || "—"}
                  </td>
                  {sizes.map((size) => {
                    const value = colour.name
                      ? (qty[qtyKey(colour.name, size)] ?? 0)
                      : 0;
                    const low = value <= alertAt;
                    return (
                      <td key={size} className="px-3 py-2">
                        <input
                          type="number"
                          min={0}
                          value={value}
                          disabled={!colour.name.trim()}
                          onChange={(e) =>
                            setQuantity(
                              colour.name,
                              size,
                              Number(e.target.value) || 0,
                            )
                          }
                          className={`w-16 rounded-md border bg-noir px-2 py-1.5 text-ivory ${
                            low ? "border-amber-400/50 text-amber-200" : "border-line"
                          }`}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-[11px] text-ivory-faint">
          Quantities at or below the alert number highlight as low stock.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onSave}
          disabled={pending}
          className="rounded-full border border-gold/40 bg-gold/10 px-5 py-2 text-xs uppercase tracking-widest text-gold disabled:opacity-40"
        >
          {pending ? "Saving…" : "Save stock"}
        </button>
        {status === "saved" ? (
          <p className="text-xs text-emerald-300">Stock saved</p>
        ) : null}
        {status === "error" ? (
          <p className="text-xs text-red-300">{error}</p>
        ) : null}
      </div>
    </section>
  );
}
