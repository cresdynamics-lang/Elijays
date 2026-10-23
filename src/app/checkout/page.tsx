"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { BRAND, formatKes, whatsappOrderUrl } from "@/lib/constants";
import { useCart } from "@/lib/cart";
import { trackMeta } from "@/lib/analytics";
import type { Fulfilment } from "@/lib/orders/fulfilment";

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

function clearCheckoutToken() {
  localStorage.removeItem("elijays-checkout-token");
}

type FormState = {
  name: string;
  phone: string;
  email: string;
  fulfilment: Fulfilment;
  address: string;
  landmark: string;
  notes: string;
  payPhone: string;
};

const emptyForm: FormState = {
  name: "",
  phone: "",
  email: "",
  fulfilment: "pickup",
  address: "",
  landmark: "",
  notes: "",
  payPhone: "",
};

export default function CheckoutPage() {
  const { resolved, subtotal, count, clear } = useCart();
  const [pay, setPay] = useState<"mpesa" | "card" | "cod">("mpesa");
  const [form, setForm] = useState<FormState>(emptyForm);
  const [placed, setPlaced] = useState<{
    token: string;
    receipt?: string;
  } | null>(null);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState("");
  const [stkMessage, setStkMessage] = useState("");
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

  const mpesaPhone = form.payPhone.trim() || form.phone.trim();

  const persistLead = async (next = form) => {
    if (!tokenRef.current) return null;
    if (!next.name && !next.phone && !next.email && !next.address) return null;
    const res = await fetch("/api/checkout/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: tokenRef.current,
        name: next.name,
        phone: next.phone,
        email: next.email,
        fulfilment: next.fulfilment,
        address: next.address,
        landmark: next.landmark,
        notes: next.notes,
        payPhone: next.payPhone.trim() || next.phone,
        items: itemsPayload,
        subtotalKes: subtotal,
      }),
      keepalive: true,
    });
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      orderId?: string;
      skipped?: boolean;
    };
    if (!res.ok) return null;
    return data;
  };

  const onField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
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
    const token = tokenRef.current;
    clearCheckoutToken();
    clear();
    setPlaced({ token, receipt: mpesaReceipt });
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
    if (form.fulfilment === "delivery" && (!form.address.trim() || !form.landmark.trim())) {
      setPayError("Enter the delivery address and nearest building.");
      return;
    }
    const lead = await persistLead(form);
    if (pay === "mpesa" && !lead?.orderId) {
      setPayError("Could not start payment — check your name and phone, then try again.");
      return;
    }

    if (pay === "mpesa") {
      setPaying(true);
      try {
        const res = await fetch("/api/payments/mpesa/stk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: tokenRef.current,
            phone: mpesaPhone,
            amountKes: subtotal,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Could not start M-Pesa");
        }
        setStkMessage(
          data.customerMessage ||
            `Check ${mpesaPhone} and enter your M-Pesa PIN to complete payment.`,
        );
        pollPayment(data.paymentId);
      } catch (err) {
        setPaying(false);
        setPayError(err instanceof Error ? err.message : "M-Pesa failed");
      }
      return;
    }

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
    const fulfilment =
      form.fulfilment === "pickup"
        ? "Collect in shop"
        : `Deliver: ${form.address}${form.landmark ? ` · ${form.landmark}` : ""}`;
    const msg = `NEW ORDER — ELIJAYS\n${form.name} · ${form.phone}\n${fulfilment}\nPay: ${pay.toUpperCase()}\n\n${lines.join("\n")}\nTotal: ${formatKes(subtotal)}\nNotes: ${form.notes || "—"}`;
    window.open(whatsappOrderUrl(msg), "_blank");
    const token = tokenRef.current;
    if (token) {
      void fetch("/api/checkout/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
        keepalive: true,
      });
    }
    clearCheckoutToken();
    clear();
    setPlaced({ token });
  };

  if (count === 0 && !placed) {
    return (
      <div className="atmosphere min-h-screen px-4 pb-28 pt-28 text-center md:px-5 md:pt-36">
        <h1 className="display text-3xl md:text-4xl">Nothing to checkout</h1>
        <Link href="/bag" className="btn-gold mt-8 inline-flex">
          Back to bag
        </Link>
      </div>
    );
  }

  if (placed) {
    return (
      <div className="atmosphere mx-auto min-h-screen max-w-xl px-4 pb-28 pt-28 text-center md:px-5 md:pt-36">
        <p className="eyebrow text-[0.6rem] md:text-[0.6875rem]">
          {placed.receipt ? "Paid" : "Order received"}
        </p>
        <h1 className="display mt-3 text-3xl md:text-5xl">
          {placed.receipt ? "Payment confirmed" : "We have your order"}
        </h1>
        <p className="whisper mt-5 text-base md:text-xl">
          {placed.receipt
            ? `M-Pesa receipt ${placed.receipt}. Print your receipt or invoice below.`
            : "Your invoice is ready. Pay from the invoice if you have not already."}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href={`/invoice/${placed.token}`} className="btn-gold">
            {placed.receipt ? "View receipt" : "View invoice"}
          </Link>
          <a href={`/api/invoice/${placed.token}`} className="btn-ghost" target="_blank" rel="noreferrer">
            Open PDF
          </a>
        </div>
        <Link href="/" className="mt-8 inline-block text-xs text-ivory/45 underline">
          Return home
        </Link>
      </div>
    );
  }

  return (
    <div className="atmosphere min-h-screen pb-24 pt-24 md:pb-28 md:pt-36">
      <div className="mx-auto grid max-w-[1000px] gap-8 px-4 md:gap-12 md:px-8 lg:grid-cols-5">
        <form onSubmit={placeOrder} className="checkout-form space-y-6 lg:col-span-3 md:space-y-8">
          <div>
            <p className="eyebrow text-[0.6rem] md:text-[0.6875rem]">Secure checkout</p>
            <h1 className="display mt-2 text-[1.75rem] md:text-5xl">Checkout</h1>
          </div>

          <section className="space-y-4 rounded-xl border border-[var(--line)] p-4 md:space-y-5 md:p-6">
            <h2 className="text-[0.6rem] uppercase tracking-[0.2em] text-ivory/45 md:text-[0.65rem]">
              Your details
            </h2>
            <label className="block">
              <span className="text-[0.6rem] uppercase tracking-[0.18em] text-ivory/45 md:text-[0.65rem]">
                Full name
              </span>
              <input
                required
                type="text"
                autoComplete="name"
                value={form.name}
                onChange={(e) => onField("name", e.target.value)}
                className="input-field mt-1"
              />
            </label>
            <label className="block">
              <span className="text-[0.6rem] uppercase tracking-[0.18em] text-ivory/45 md:text-[0.65rem]">
                Phone
              </span>
              <input
                required
                type="tel"
                autoComplete="tel"
                value={form.phone}
                onChange={(e) => onField("phone", e.target.value)}
                className="input-field mt-1"
              />
              <span className="mt-1.5 block text-[11px] leading-snug text-ivory/40 md:text-xs">
                For order updates. You can use a different number for M-Pesa below.
              </span>
            </label>
            <label className="block">
              <span className="text-[0.6rem] uppercase tracking-[0.18em] text-ivory/45 md:text-[0.65rem]">
                Email (optional)
              </span>
              <input
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(e) => onField("email", e.target.value)}
                className="input-field mt-1"
              />
            </label>
          </section>

          <section className="space-y-4 rounded-xl border border-[var(--line)] p-4 md:space-y-5 md:p-6">
            <h2 className="text-[0.6rem] uppercase tracking-[0.2em] text-ivory/45 md:text-[0.65rem]">
              How should we get this to you?
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  ["pickup", "Collect in shop"],
                  ["delivery", "Deliver to me"],
                ] as const
              ).map(([v, label]) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => onField("fulfilment", v)}
                  className={`chip w-full justify-center px-2 py-2.5 text-[0.58rem] md:text-[0.6875rem] ${
                    form.fulfilment === v ? "active" : ""
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            {form.fulfilment === "pickup" ? (
              <p className="text-[11px] leading-relaxed text-ivory/50 md:text-sm">
                Collect at {BRAND.address.street}, {BRAND.address.junction}. {BRAND.hours}.
              </p>
            ) : (
              <div className="space-y-4">
                <label className="block">
                  <span className="text-[0.6rem] uppercase tracking-[0.18em] text-ivory/45 md:text-[0.65rem]">
                    Delivery address
                  </span>
                  <input
                    required
                    type="text"
                    autoComplete="street-address"
                    placeholder="Street, estate, area"
                    value={form.address}
                    onChange={(e) => onField("address", e.target.value)}
                    className="input-field mt-1"
                  />
                </label>
                <label className="block">
                  <span className="text-[0.6rem] uppercase tracking-[0.18em] text-ivory/45 md:text-[0.65rem]">
                    Nearest building
                  </span>
                  <input
                    required
                    type="text"
                    placeholder="Building, landmark or gate"
                    value={form.landmark}
                    onChange={(e) => onField("landmark", e.target.value)}
                    className="input-field mt-1"
                  />
                </label>
              </div>
            )}
          </section>

          <label className="block">
            <span className="text-[0.6rem] uppercase tracking-[0.18em] text-ivory/45 md:text-[0.65rem]">
              Notes / alterations (optional)
            </span>
            <textarea
              value={form.notes}
              onChange={(e) => onField("notes", e.target.value)}
              className="input-field mt-1 min-h-20 resize-y text-[0.8125rem] md:min-h-24 md:text-[0.95rem]"
            />
          </label>

          <section className="space-y-4 rounded-xl border border-[var(--line)] p-4 md:space-y-5 md:p-6">
            <h2 className="text-[0.6rem] uppercase tracking-[0.2em] text-ivory/45 md:text-[0.65rem]">
              Pay for this order
            </h2>
            <div className="flex flex-wrap gap-2">
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
                  className={`chip px-3 py-2 text-[0.58rem] md:text-[0.6875rem] ${pay === v ? "active" : ""}`}
                >
                  {label}
                </button>
              ))}
            </div>

            {pay === "mpesa" ? (
              <label className="block">
                <span className="text-[0.6rem] uppercase tracking-[0.18em] text-ivory/45 md:text-[0.65rem]">
                  M-Pesa number for the PIN prompt
                </span>
                <input
                  type="tel"
                  inputMode="tel"
                  placeholder={form.phone || "07xx xxx xxx"}
                  value={form.payPhone}
                  onChange={(e) => onField("payPhone", e.target.value)}
                  className="input-field mt-1"
                />
                <span className="mt-1.5 block text-[11px] leading-snug text-ivory/40 md:text-xs">
                  This number receives the M-Pesa PIN prompt. Leave blank to use{" "}
                  {form.phone || "the phone above"}.
                </span>
              </label>
            ) : (
              <p className="text-[11px] text-ivory/40 md:text-xs">
                {pay === "cod"
                  ? "Pay when you collect or when the order arrives."
                  : "A stylist will confirm card payment on WhatsApp."}
              </p>
            )}
          </section>

          {stkMessage ? (
            <p className="rounded-lg border border-gold/30 bg-gold/5 px-4 py-3 text-[12px] text-gold md:text-sm">
              {stkMessage}
            </p>
          ) : null}
          {payError ? (
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-[12px] text-red-200 md:text-sm">
              {payError}
            </p>
          ) : null}

          <button type="submit" className="btn-gold w-full text-[0.7rem] md:w-auto md:text-[0.75rem]" disabled={paying}>
            {paying
              ? "Waiting for M-Pesa PIN…"
              : pay === "mpesa"
                ? `Pay now · ${formatKes(subtotal)}`
                : `Place order · ${formatKes(subtotal)}`}
          </button>
          <p className="text-[11px] text-ivory/40 md:text-sm">
            Or continue on WhatsApp — {BRAND.phone}
          </p>
        </form>

        <aside className="lg:col-span-2">
          <div className="sticky top-24 rounded-xl border border-[var(--line)] p-4 md:top-28 md:p-6">
            <p className="eyebrow text-[0.6rem] md:text-[0.6875rem]">Your bag</p>
            <ul className="mt-4 space-y-3">
              {resolved.map(({ product, item }) => (
                <li
                  key={`${product.slug}-${item.size}`}
                  className="flex justify-between gap-3 text-[12px] md:text-sm"
                >
                  <span>
                    {product.name}
                    {item.size ? ` · ${item.size}` : ""} × {item.qty}
                  </span>
                  <span className="shrink-0">{formatKes(product.price * item.qty)}</span>
                </li>
              ))}
            </ul>
            <p className="mt-6 flex justify-between border-t border-[var(--line)] pt-4 font-display text-lg md:text-xl">
              <span>Total</span>
              <span>{formatKes(subtotal)}</span>
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
