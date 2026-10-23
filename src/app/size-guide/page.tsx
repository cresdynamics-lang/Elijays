import type { Metadata } from "next";
import { whatsappFittingUrl } from "@/lib/constants";

export const metadata: Metadata = { title: "Size Guide" };

export default function SizeGuidePage() {
  return (
    <div className="atmosphere min-h-screen pt-28 md:pt-36 pb-28">
      <div className="mx-auto max-w-4xl px-5 md:px-8">
        <p className="eyebrow">Fit certainty</p>
        <h1 className="display text-5xl md:text-6xl mt-4">Size guide</h1>
        <p className="whisper text-xl mt-5">
          Every purchase includes free in-store alterations. When in doubt, book a fitting.
        </p>

        <div className="mt-14 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--line)] text-[0.65rem] tracking-[0.18em] uppercase text-gold">
                <th className="py-4 pr-4">Size</th>
                <th className="py-4 pr-4">Chest (in)</th>
                <th className="py-4 pr-4">Waist (in)</th>
                <th className="py-4">Neck (in)</th>
              </tr>
            </thead>
            <tbody className="text-ivory/70">
              {[
                ["S", "36–38", "30–32", "14.5–15"],
                ["M", "38–40", "32–34", "15–15.5"],
                ["L", "40–42", "34–36", "15.5–16"],
                ["XL", "42–44", "36–38", "16–16.5"],
                ["XXL", "44–46", "38–40", "16.5–17"],
              ].map((row) => (
                <tr key={row[0]} className="border-b border-[var(--line)]">
                  {row.map((c) => (
                    <td key={c} className="py-4 pr-4">
                      {c}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-12 border border-[var(--line)] p-8">
          <p className="display text-2xl">Belts</p>
          <p className="mt-3 text-ivory/55">
            Choose your usual trouser waist size. We can punch an extra hole in-store if needed.
          </p>
        </div>

        <a
          href={whatsappFittingUrl()}
          target="_blank"
          rel="noreferrer"
          className="btn-gold mt-10 inline-flex"
        >
          Book a fitting
        </a>
      </div>
    </div>
  );
}
