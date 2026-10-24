import Link from "next/link";
import Image from "next/image";

// Small photo shown before a product name in admin tables. Decorative: the
// name next to it carries the same link for keyboard and screen-reader users.
export function ProductThumb({
  href,
  src,
}: {
  href: string;
  src: string | null | undefined;
}) {
  return (
    <Link
      href={href}
      aria-hidden
      tabIndex={-1}
      className="relative block h-14 w-11 shrink-0 overflow-hidden rounded-md border border-line bg-noir transition hover:border-gold/40"
    >
      {src ? (
        <Image
          src={src}
          alt=""
          fill
          sizes="44px"
          className="object-cover"
          unoptimized
        />
      ) : (
        <span className="flex h-full items-center justify-center text-[8px] uppercase tracking-widest text-ivory-faint">
          No photo
        </span>
      )}
    </Link>
  );
}
