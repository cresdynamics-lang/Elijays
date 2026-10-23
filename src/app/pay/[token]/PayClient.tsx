"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { BRAND, formatKes } from "@/lib/constants";

export function PayClient({
  token,
  amountKes,
  name,
  note,
  phone,
}: {
  token: string;
  amountKes: number;
  name: string;
  note: string;
  phone: string;
}) {
  const [mpesaPhone, setMpesaPhone] = useState(phone);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState("");
  const [stkMessage, setStkMessage] = useState("");
  const [receipt, setReceipt] = useState("");
  const [paid, setPaid] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

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
          setReceipt(data.mpesaReceipt || "");
          setPaid(true);
          setPaying(false);
        } else if (data.status === "FAILED") {
          if (pollRef.current) clearInterval(pollRef.current);
          setPaying(false);
          setPayError("Payment was cancelled or failed. Try again.");
        } else if (ticks > 40) {
          if (pollRef.current) clearInterval(pollRef.current);
          setPaying(false);
          setPayError(
            "No confirmation yet. If you paid, keep this page or message the shop.",
          );
        }
      } catch {
        /* keep polling */
      }
    }, 3000);
  };

  const pay = async (e: React.FormEvent) => {
    e.preventDefault();
    setPayError("");
    setStkMessage("");
    setPaying(true);
    try {
      const res = await fetch("/api/payments/mpesa/stk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          phone: mpesaPhone,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not start M-Pesa");
      setStkMessage(
        data.customerMessage ||
          "Check your phone and enter your M-Pesa PIN.",
      );
      pollPayment(data.paymentId);
    } catch (err) {
      setPaying(false);
      setPayError(err instanceof Error ? err.message : "M-Pesa failed");
    }
  };

  if (paid) {
    return (
      <div className="text-center">
        <p className="eyebrow">Paid</p>
        <h1 className="display mt-4 text-5xl">Payment confirmed</h1>
        <p className="whisper mt-6 text-xl">
          {receipt ? `M-Pesa receipt ${receipt}.` : "ELIJAYS has your payment."}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href={`/invoice/${token}`} className="btn-gold">
            View receipt
          </Link>
          <a
            href={`/api/invoice/${token}`}
            className="btn-ghost"
            target="_blank"
            rel="noreferrer"
          >
            Open PDF
          </a>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={pay} className="space-y-8">
      <div>
        <p className="eyebrow">Settle with ELIJAYS</p>
        <h1 className="display mt-3 text-5xl">{formatKes(amountKes)}</h1>
        {name ? (
          <p className="mt-3 text-ivory/70">{name}</p>
        ) : null}
        {note ? (
          <p className="mt-1 text-sm text-ivory/45">{note}</p>
        ) : null}
      </div>

      <label className="block">
        <span className="text-[0.65rem] uppercase tracking-[0.2em] text-ivory/45">
          M-Pesa number
        </span>
        <input
          required
          type="tel"
          value={mpesaPhone}
          onChange={(e) => setMpesaPhone(e.target.value)}
          placeholder="07XX XXX XXX"
          className="input-field mt-2"
        />
      </label>

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
        {paying ? "Waiting for M-Pesa…" : `Pay now · ${formatKes(amountKes)}`}
      </button>
      <p className="text-sm text-ivory/45">
        Enter your M-Pesa PIN on the phone. Shop: {BRAND.phone}
      </p>
      <p className="text-xs text-ivory/35">
        <Link href={`/invoice/${token}`} className="underline">
          View invoice
        </Link>
        {" · "}
        <a href={`/api/invoice/${token}`} className="underline" target="_blank" rel="noreferrer">
          Download PDF
        </a>
      </p>
    </form>
  );
}
