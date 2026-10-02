"use client";

import Image from "next/image";
import { useState } from "react";
import { BRAND, whatsappOrderUrl } from "@/lib/constants";

const STEPS = [
  {
    n: "01",
    title: "Consult",
    text: "Tell us the room you are walking into.",
  },
  {
    n: "02",
    title: "Choose the cloth",
    text: "Fabrics, linings, buttons, monogram.",
  },
  {
    n: "03",
    title: "Measure",
    text: "Precise measures at Kimathi Street. Kept on file for life.",
  },
  {
    n: "04",
    title: "Collect",
    text: "Final fitting, adjustments, and the quiet confidence of something made only for you.",
  },
];

export default function BespokePage() {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    occasion: "",
    date: "",
    time: "",
  });
  const [sent, setSent] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const msg = `Bespoke fitting request\nName: ${form.name}\nPhone: ${form.phone}\nOccasion: ${form.occasion}\nPreferred: ${form.date} ${form.time}`;
    window.open(whatsappOrderUrl(msg), "_blank");
    setSent(true);
  };

  return (
    <div>
      <section className="relative min-h-[85svh] flex items-end overflow-hidden">
        <Image
          src="/hero/hero-suits.jpg"
          alt="Bespoke"
          fill
          priority
          className="object-cover animate-slow-zoom"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-noir via-noir/60 to-noir/35" />
        <div className="absolute inset-0 bg-purple/10" />
        <div className="relative z-10 mx-auto max-w-[1600px] w-full px-5 md:px-8 lg:px-12 pb-20 md:pb-28 pt-40">
          <p className="eyebrow">Bespoke</p>
          <h1 className="display text-5xl md:text-7xl lg:text-8xl mt-6 max-w-3xl">
            Made for one man.
            <br />
            <span className="text-gold">Cut for you.</span>
          </h1>
          <a href="#book" className="btn-gold mt-10 inline-flex">
            Book your fitting
          </a>
        </div>
      </section>

      <section className="section-pad">
        <div className="mx-auto max-w-[1600px]">
          <p className="eyebrow mb-12">The process</p>
          <div className="grid md:grid-cols-4 gap-10 md:gap-8">
            {STEPS.map((s) => (
              <div key={s.n} className="border-t border-[var(--line)] pt-8">
                <p className="text-gold text-sm tracking-[0.2em]">{s.n}</p>
                <h2 className="display text-2xl md:text-3xl mt-4">{s.title}</h2>
                <p className="mt-4 text-ivory/55 leading-relaxed">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 md:px-8 lg:px-12 pb-20">
        <div className="mx-auto max-w-[1600px] border border-[var(--line)] p-10 md:p-16 bg-noir-soft/40">
          <p className="eyebrow">What we make</p>
          <p className="display text-3xl md:text-4xl mt-4 max-w-3xl">
            Suits · Waistcoats · Trousers · Shirts · Wedding parties · Corporate wardrobes
          </p>
        </div>
      </section>

      <section id="book" className="section-pad pt-0">
        <div className="mx-auto max-w-2xl">
          <p className="eyebrow">Book a fitting</p>
          <h2 className="display text-4xl md:text-5xl mt-4">Reserve your hour</h2>
          <p className="whisper text-lg mt-4">Confirmed on WhatsApp within the hour.</p>

          <form onSubmit={submit} className="mt-12 space-y-8">
            {(
              [
                ["name", "Name", "text"],
                ["phone", "Phone", "tel"],
                ["occasion", "Occasion", "text"],
                ["date", "Preferred date", "date"],
                ["time", "Preferred time", "time"],
              ] as const
            ).map(([key, label, type]) => (
              <label key={key} className="block">
                <span className="text-[0.65rem] tracking-[0.2em] uppercase text-ivory/45">
                  {label}
                </span>
                <input
                  required
                  type={type}
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  className="input-field mt-2"
                />
              </label>
            ))}
            <button type="submit" className="btn-gold w-full sm:w-auto">
              {sent ? "Opening WhatsApp…" : "Book fitting"}
            </button>
          </form>
          <p className="mt-6 text-sm text-ivory/40">
            Or call / WhatsApp {BRAND.phone}
          </p>
        </div>
      </section>
    </div>
  );
}
