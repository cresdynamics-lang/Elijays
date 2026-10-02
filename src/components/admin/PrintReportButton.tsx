"use client";

export function PrintReportButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-full border border-gold/40 bg-gold/10 px-5 py-2 text-xs uppercase tracking-widest text-gold"
    >
      Print PDF
    </button>
  );
}
