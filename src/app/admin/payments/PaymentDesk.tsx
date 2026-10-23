"use client";

import { useActionState, useMemo, useState } from "react";
import {
  createPaymentLink,
  promptInStore,
  type PaymentDeskState,
} from "./actions";
import { formatKes } from "@/components/admin/formatKes";
import { BRAND } from "@/lib/constants";

const empty: PaymentDeskState = {};

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm">
      <span className="text-[11px] uppercase tracking-widest text-ivory-faint">
        {label}
      </span>
      {children}
    </label>
  );
}

const inputClass =
  "mt-1 w-full rounded-lg border border-line bg-noir px-3 py-2 text-ivory";

function ResultCard({ state }: { state: PaymentDeskState }) {
  const [copied, setCopied] = useState(false);
  const wa = useMemo(() => {
    if (!state.url || !state.amountKes) return "";
    const msg = [
      `ELIJAYS payment`,
      formatKes(state.amountKes),
      state.url,
      "",
      "Open the link and pay with M-Pesa.",
    ].join("\n");
    const to = state.phone ? `https://wa.me/${state.phone}?text=` : "https://wa.me/?text=";
    return `${to}${encodeURIComponent(msg)}`;
  }, [state.amountKes, state.phone, state.url]);

  if (state.error) {
    return (
      <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
        {state.error}
      </p>
    );
  }
  if (!state.ok) return null;

  return (
    <div className="space-y-3 rounded-lg border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-gold">
      <p>{state.ok}</p>
      {state.orderNumber ? (
        <p className="text-ivory-muted">Saved as order #{state.orderNumber}.</p>
      ) : null}
      {state.url ? (
        <div className="space-y-2">
          <p className="break-all text-ivory">{state.url}</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-full border border-gold/40 px-3 py-1 text-xs uppercase tracking-widest text-gold"
              onClick={async () => {
                await navigator.clipboard.writeText(state.url || "");
                setCopied(true);
                setTimeout(() => setCopied(false), 1600);
              }}
            >
              {copied ? "Copied" : "Copy link"}
            </button>
            {wa ? (
              <a
                href={wa}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-gold/40 px-3 py-1 text-xs uppercase tracking-widest text-gold"
              >
                Send on WhatsApp
              </a>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function PaymentDesk() {
  const [tab, setTab] = useState<"prompt" | "link">("prompt");
  const [promptState, promptAction, prompting] = useActionState(
    promptInStore,
    empty,
  );
  const [linkState, linkAction, linking] = useActionState(
    createPaymentLink,
    empty,
  );

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-xl border border-line bg-noir-soft/40 p-6">
        <div className="mb-5 flex gap-2">
          {(
            [
              ["prompt", "Prompt in store"],
              ["link", "Payment link"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`rounded-full border px-3 py-1.5 text-xs uppercase tracking-widest ${
                tab === key
                  ? "border-gold/40 bg-gold/15 text-gold"
                  : "border-line text-ivory-muted"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "prompt" ? (
          <form action={promptAction} className="space-y-4">
            <p className="text-sm text-ivory-muted">
              Send an M-Pesa PIN prompt to the phone in front of you. Till, fittings,
              alterations, deposits.
            </p>
            <ResultCard state={promptState} />
            <Field label="Amount (KES)">
              <input
                name="amountKes"
                inputMode="numeric"
                required
                placeholder="e.g. 2500"
                className={inputClass}
              />
            </Field>
            <Field label="M-Pesa number">
              <input
                name="phone"
                required
                placeholder="07XX XXX XXX"
                className={inputClass}
              />
            </Field>
            <Field label="Customer name">
              <input name="name" placeholder="Walk-in" className={inputClass} />
            </Field>
            <Field label="What for">
              <input
                name="note"
                placeholder="Alterations · deposit · suit"
                className={inputClass}
              />
            </Field>
            <button
              type="submit"
              disabled={prompting}
              className="rounded-full border border-gold/40 bg-gold/10 px-5 py-2 text-xs font-medium uppercase tracking-widest text-gold disabled:opacity-50"
            >
              {prompting ? "Sending prompt…" : "Send M-Pesa prompt"}
            </button>
          </form>
        ) : (
          <form action={linkAction} className="space-y-4">
            <p className="text-sm text-ivory-muted">
              Create a link the customer can open on their phone to pay. WhatsApp it,
              or read it out.
            </p>
            <ResultCard state={linkState} />
            <Field label="Amount (KES)">
              <input
                name="amountKes"
                inputMode="numeric"
                required
                placeholder="e.g. 28500"
                className={inputClass}
              />
            </Field>
            <Field label="Customer name">
              <input name="name" className={inputClass} />
            </Field>
            <Field label="Phone (optional — for WhatsApp)">
              <input name="phone" placeholder="07XX XXX XXX" className={inputClass} />
            </Field>
            <Field label="What for">
              <input
                name="note"
                placeholder="Balance on order · deposit"
                className={inputClass}
              />
            </Field>
            <button
              type="submit"
              disabled={linking}
              className="rounded-full border border-gold/40 bg-gold/10 px-5 py-2 text-xs font-medium uppercase tracking-widest text-gold disabled:opacity-50"
            >
              {linking ? "Creating link…" : "Create payment link"}
            </button>
            <p className="text-xs text-ivory-faint">
              They land on {BRAND.fullName} and pay with M-Pesa.
            </p>
          </form>
        )}
      </section>
      <aside className="rounded-xl border border-line bg-noir-soft/40 p-6 text-sm text-ivory-muted">
        <h2 className="mb-3 text-xs uppercase tracking-widest text-ivory-faint">
          How it settles
        </h2>
        <ul className="space-y-3">
          <li>
            <strong className="text-ivory">In store.</strong> You type the amount and
            their number. Their phone gets the PIN prompt. When they pay, the order
            marks paid.
          </li>
          <li>
            <strong className="text-ivory">Payment link.</strong> Share the URL. They
            enter their M-Pesa number and pay. Same PIN prompt as checkout.
          </li>
        </ul>
      </aside>
    </div>
  );
}
