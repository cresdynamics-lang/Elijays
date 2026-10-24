import Link from "next/link";

type LinkItem = { label: string; href: string };

type Props = {
  index: number;
  label: string;
  subline: string;
  href: string;
  links?: LinkItem[];
};

export function CategoryCard({ index, label, subline, href, links = [] }: Props) {
  const n = String(index + 1).padStart(2, "0");
  const preview = links.filter((l) => l.href !== href).slice(0, 3);

  return (
    <Link
      href={href}
      className="group relative flex min-h-[190px] flex-col justify-between overflow-hidden rounded-xl border border-[var(--line)] bg-gradient-to-br from-noir-elevated/90 via-noir-soft/50 to-noir p-4 transition duration-500 sm:min-h-[280px] sm:p-7 hover:border-gold/50 hover:shadow-[0_24px_60px_-28px_rgba(232,206,150,0.28)] md:min-h-[320px] md:p-8"
    >
      <span className="pointer-events-none absolute left-4 top-0 h-px w-10 sm:left-7 bg-gold/50 transition-all duration-500 group-hover:w-20" />
      <span
        className="pointer-events-none absolute -right-2 -top-4 font-[family-name:var(--font-playfair)] text-[4.5rem] leading-none sm:-right-3 sm:-top-8 sm:text-[7.5rem] text-gold/[0.08] transition-colors group-hover:text-gold/[0.14] md:text-[8.5rem]"
        aria-hidden
      >
        {n}
      </span>
      <div className="relative">
        <p className="text-[0.55rem] uppercase tracking-[0.2em] text-gold/70 sm:text-[0.65rem] sm:tracking-[0.28em]">
          {n} · Wardrobe
        </p>
        <h3 className="display mt-3 text-xl text-ivory transition-colors group-hover:text-gold sm:mt-4 sm:text-3xl md:text-4xl">
          {label}
        </h3>
        <p className="whisper mt-2 line-clamp-3 max-w-xs text-sm text-ivory/70 sm:mt-3 sm:text-lg">{subline}</p>
      </div>
      <div className="relative mt-4 sm:mt-8">
        {preview.length > 0 ? (
          <ul className="hidden space-y-1.5 text-[0.68rem] uppercase tracking-[0.16em] text-ivory/40 sm:block">
            {preview.map((item) => (
              <li key={item.href + item.label} className="flex items-center gap-2">
                <span className="h-px w-3 bg-gold/35" aria-hidden />
                {item.label}
              </li>
            ))}
          </ul>
        ) : null}
        <p className="text-[0.55rem] uppercase tracking-[0.16em] text-gold sm:mt-6 sm:text-[0.65rem] sm:tracking-[0.22em]">
          Enter {label.toLowerCase()} →
        </p>
      </div>
    </Link>
  );
}
