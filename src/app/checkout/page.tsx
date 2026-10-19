"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { BRAND, formatKes, whatsappOrderUrl } from "@/lib/constants";
import { useCart } from "@/lib/cart";
import { trackMeta } from "@/lib/analytics";

function getCheckoutToken() {
  if (typeof window === "undefined") return "";
  const key = "elijays-checkout-token";
  let t = localStorage.getItem(key);
  if (!t) {
    t = crypto.randomUUID();
    localStorage.setItem(key, t);
  }
  return t;
}

export default function CheckoutPage() {
  const { resolved, subtotal, count, clear } = useCart();
  const [pay, setPay] = useState<"mpesa" | "card" | "cod">("mpesa");
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    notes: "",
  });
  const [placed, setPlaced] = useState(false);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState("");
  const [stkMessage, setStkMessage] = useState("");
  const [receipt, setReceipt] = useState("");
  const tokenRef = useRef("");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    tokenRef.current = getCheckoutToken();
    trackMeta({
      name: "InitiateCheckout",
      content_ids: resolved.map(({ product }) => product.slug),
      value: subtotal,
      currency: "KES",
      num_items: count,
    });
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const itemsPayload = useMemo(
    () =>
      resolved.map(({ product, item }) => ({
        name: product.name,
        size: item.size,
        qty: item.qty,
        unitKes: product.price,
      })),
    [resolved],
  );

  const persistLead = async (next = form) => {
    if (!tokenRef.current) return;
    if (!next.name && !next.phone && !next.email && !next.address) return;
    await fetch("/api/checkout/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: tokenRef.current,
        name: next.name,
        phone: next.phone,
        email: next.email,
        address: next.address,
        notes: next.notes,
        items: itemsPayload,
        subtotalKes: subtotal,
      }),
      keepalive: true,
    });
  };

  const onField = (key: keyof typeof form, value: string) => {
    const next = { ...form, [key]: value };
    setForm(next);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void persistLead(next);
    }, 400);
  };

  useEffect(() => {
    const flush = () => {
      void persistLead();
    };
    window.addEventListener("pagehide", flush);
    window.addEventListener("beforeunload", flush);
    return () => {
      window.removeEventListener("pagehide", flush);
      window.removeEventListener("beforeunload", flush);
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, itemsPayload, subtotal]);

  const finishPaid = (mpesaReceipt?: string) => {
    trackMeta({
      name: "Purchase",
      content_ids: resolved.map(({ product }) => product.slug),
      value: subtotal,
      currency: "KES",
      num_items: count,
    });
    if (mpesaReceipt) setReceipt(mpesaReceipt);
    clear();
    setPlaced(true);
    setPaying(false);
  };

  const pollPayment = (paymentId: string) => {
    if (pollRef.current) clearInterval(pollRef.current);
    let ticks = 0;
    pollRef.current = setInterval(async () => {
      ticks += 1;
      try {
        const res = await fetch(
          `/api/payments/mpesa/status?paymentId=${encodeURIComponent(paymentId)}`,
        );
        const data = await res.json();
        if (data.status === "PAID") {
          if (pollRef.current) clearInterval(pollRef.current);
          finishPaid(data.mpesaReceipt);
        } else if (data.status === "FAILED") {
          if (pollRef.current) clearInterval(pollRef.current);
          setPaying(false);
          setPayError("Payment was cancelled or failed. Try again.");
        } else if (ticks > 40) {
          if (pollRef.current) clearInterval(pollRef.current);
          setPaying(false);
          setPayError(
            "No confirmation yet. If you paid, keep this page — we’ll confirm shortly — or contact the shop.",
          );
        }
      } catch {
        /* keep polling */
      }
    }, 3000);
  };

  const placeOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setPayError("");
    setStkMessage("");
    await persistLead(form);

    if (pay === "mpesa") {
      setPaying(true);
      try {
        const res = await fetch("/api/payments/mpesa/stk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: tokenRef.current,
            phone: form.phone,
            amountKes: subtotal,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Could not start M-Pesa");
        }
        setStkMessage(
          data.customerMessage ||
            "Check your phone and enter your M-Pesa PIN to complete payment.",
        );
        pollPayment(data.paymentId);
      } catch (err) {
        setPaying(false);
        setPayError(err instanceof Error ? err.message : "M-Pesa failed");
      }
      return;
    }

    // Card / COD — WhatsApp handoff for now (card gateway next)
    trackMeta({
      name: "Purchase",
      content_ids: resolved.map(({ product }) => product.slug),
      value: subtotal,
      currency: "KES",
      num_items: count,
    });
    const lines = resolved.map(
      ({ product, item }) =>
        `• ${product.name}${item.size ? ` (${item.size})` : ""} × ${item.qty}`,
    );
    const msg = `NEW ORDER — ELIJAYS\n${form.name} · ${form.phone}\n${form.address}\nPay: ${pay.toUpperCase()}\n\n${lines.join("\n")}\nTotal: ${formatKes(subtotal)}\nNotes: ${form.notes || "—"}`;
    window.open(whatsappOrderUrl(msg), "_blank");
    if (tokenRef.current) {
      void fetch("/api/checkout/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: tokenRef.current }),
        keepalive: true,
      });
    }
    clear();
    setPlaced(true);
  };

  if (count === 0 && !placed) {
    return (
      <div className="atmosphere min-h-screen px-5 pb-28 pt-36 text-center">
        <h1 className="display text-4xl">Nothing to checkout</h1>
        <Link href="/bag" className="btn-gold mt-8 inline-flex">
          Back to bag
        </Link>
      </div>
    );
  }

  if (placed) {
    return (
      <div className="atmosphere mx-auto min-h-screen max-w-xl px-5 pb-28 pt-36 text-center">
        <p className="eyebrow">Order received</p>
        <h1 className="display mt-4 text-5xl">
          {receipt ? "Payment confirmed" : "We have your order"}
        </h1>
        <p className="whisper mt-6 text-xl">
          {receipt
            ? `M-Pesa receipt ${receipt}. A stylist will confirm delivery on WhatsApp.`
            : "A stylist will confirm on WhatsApp shortly."}
        </p>
        <Link href="/" className="btn-gold mt-10 inline-flex">
          Return home
        </Link>
      </div>
    );
  }

  return (
    <div className="atmosphere min-h-screen pb-28 pt-28 md:pt-36">
      <div className="mx-auto grid max-w-[1000px] gap-12 px-5 md:px-8 lg:grid-cols-5">
        <form onSubmit={placeOrder} className="space-y-8 lg:col-span-3">
          <h1 className="display text-5xl">Checkout</h1>

          {(
            [
              ["name", "Full name", "text"],
              ["phone", "M-Pesa / phone", "tel"],
              ["email", "Email (optional)", "email"],
              ["address", "Delivery address (Nairobi)", "text"],
            ] as const
          ).map(([key, label, type]) => (
            <label key={key} className="block">
              <span className="text-[0.65rem] uppercase tracking-[0.2em] text-ivory/45">
                {label}
              </span>
              <input
                required={key !== "email"}
                type={type}
                value={form[key]}
                onChange={(e) => onField(key, e.target.value)}
                className="input-field mt-2"
              />
            </label>
          ))}
          <label className="block">
            <span className="text-[0.65rem] uppercase tracking-[0.2em] text-ivory/45">
              Notes / alterations
            </span>
            <textarea
              value={form.notes}
              onChange={(e) => onField("notes", e.target.value)}
              className="input-field mt-2 min-h-24 resize-y"
            />
          </label>

          <div>
            <p className="mb-4 text-[0.65rem] uppercase tracking-[0.2em] text-ivory/45">
              Pay with
            </p>
            <div className="flex flex-wrap gap-3">
              {(
                [
                  ["mpesa", "M-Pesa"],
                  ["card", "Card"],
                  ["cod", "Pay on delivery"],
                ] as const
              ).map(([v, label]) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setPay(v)}
                  className={`chip ${pay === v ? "active" : ""}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {stkMessage ? (
            <p className="rounded-lg border border-gold/30 bg-gold/5 px-4 py-3 text-sm text-gold">
              {stkMessage}
            </p>
          ) : null}
          {payError ? (
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {payError}
            </p>
          ) : null}

          <button type="submit" className="btn-gold" disabled={paying}>
            {paying
              ? "Waiting for M-Pesa…"
              : pay === "mpesa"
                ? `Pay with M-Pesa · ${formatKes(subtotal)}`
                : `Place order · ${formatKes(subtotal)}`}
          </button>
          <p className="text-sm text-ivory/45">
            Or continue on WhatsApp — {BRAND.phone}
          </p>
        </form>

        <aside className="lg:col-span-2">
          <div className="sticky top-28 rounded-xl border border-[var(--line)] p-6">
            <p className="eyebrow">Your bag</p>
            <ul className="mt-4 space-y-3">
              {resolved.map(({ product, item }) => (
                <li
                  key={`${product.slug}-${item.size}`}
                  className="flex justify-between text-sm"
                >
                  <span>
                    {product.name}
                    {item.size ? ` · ${item.size}` : ""} × {item.qty}
                  </span>
                  <span>{formatKes(product.price * item.qty)}</span>
                </li>
              ))}
            </ul>
            <p className="mt-6 flex justify-between border-t border-[var(--line)] pt-4 font-display text-xl">
              <span>Total</span>
              <span>{formatKes(subtotal)}</span>
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
