"use client";

import Link from "next/link";
import { useState } from "react";

const STEPS = [
  {
    key: "occasion",
    question: "Which room are you walking into?",
    options: [
      { label: "Boardroom / Court", value: "formal", href: "/shirts/formal" },
      { label: "Everyday command", value: "oxford", href: "/shirts/oxford" },
      { label: "Weekend", value: "polo", href: "/shirts/polo" },
      { label: "Evening / Wedding", value: "printed", href: "/shirts/printed" },
      { label: "Heat / Coast", value: "linen", href: "/shirts/linen" },
      { label: "Black tie", value: "evening", href: "/shirts/evening" },
    ],
  },
];

export default function ShirtGuidePage() {
  const [picked, setPicked] = useState<(typeof STEPS)[0]["options"][0] | null>(null);

  return (
    <div className="atmosphere min-h-screen pt-28 md:pt-36 pb-28">
      <div className="mx-auto max-w-3xl px-5 md:px-8">
        <p className="eyebrow">30-second guide</p>
        <h1 className="display text-4xl md:text-6xl mt-4">Find your shirt family</h1>
        <p className="whisper text-xl mt-5">Occasion, then collar, then fit — or jump straight in.</p>

        <div className="mt-14 space-y-4">
          <p className="text-[0.65rem] tracking-[0.2em] uppercase text-gold">
            {STEPS[0].question}
          </p>
          {STEPS[0].options.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => setPicked(o)}
              className={`w-full text-left border px-6 py-5 transition-colors ${
                picked?.value === o.value
                  ? "border-gold text-gold bg-gold/5"
                  : "border-[var(--line)] text-ivory/80 hover:border-gold/50"
              }`}
            >
              <span className="display text-xl">{o.label}</span>
            </button>
          ))}
        </div>

        {picked && (
          <Link href={picked.href} className="btn-gold mt-10 inline-flex">
            See {picked.label} shirts
          </Link>
        )}
      </div>
    </div>
  );
}
