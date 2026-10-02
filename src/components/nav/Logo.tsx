import Link from "next/link";

type LogoProps = {
  size?: "sm" | "md";
  className?: string;
};

export function Logo({ size = "md", className = "" }: LogoProps) {
  const circle = size === "sm" ? "h-8 w-8 text-[0.65rem]" : "h-10 w-10 text-xs";
  const word = size === "sm" ? "text-lg tracking-[0.18em]" : "text-xl tracking-[0.22em] md:text-2xl";

  return (
    <Link
      href="/"
      className={`inline-flex items-center gap-3 text-gold ${className}`}
      aria-label="ELIJAYS Men's Wear home"
    >
      <span
        className={`inline-flex ${circle} items-center justify-center rounded-full border border-gold/80 font-[family-name:var(--font-playfair)] font-medium text-gold`}
        aria-hidden
      >
        EJ
      </span>
      <span
        className={`font-[family-name:var(--font-playfair)] font-medium uppercase text-ivory ${word}`}
      >
        ELIJAYS
      </span>
    </Link>
  );
}
