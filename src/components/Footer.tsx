import Link from "next/link";
import { BRAND } from "@/lib/constants";
import {
  getEnabledCategories,
  getWhatsAppStylistUrl,
  navigationConfig,
} from "@/lib/navigation";

export function Footer() {
  const categories = getEnabledCategories();
  const secondary = navigationConfig.secondary;
  const mid = Math.ceil(categories.length / 2);
  const colA = categories.slice(0, mid);
  const colB = categories.slice(mid);

  return (
    <footer className="border-t border-[var(--line)] bg-noir-soft print:hidden">
      <div className="mx-auto max-w-[1600px] px-5 py-16 md:px-8 lg:px-12 lg:py-24">
        <div className="grid gap-14 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <p className="font-[family-name:var(--font-playfair)] text-3xl text-gold md:text-4xl">
              {BRAND.name}
            </p>
            <p className="whisper mt-4 max-w-sm text-xl">
              Men&apos;s wear on Muindi Mbingu Street.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-ivory/55">
              {BRAND.address.street}
              <br />
              {BRAND.address.junction}, {BRAND.address.city}
            </p>
          </div>

          <div className="lg:col-span-2">
            <p className="eyebrow mb-5">Shop</p>
            <ul className="space-y-3">
              {colA.map((c) => (
                <li key={c.id}>
                  <Link
                    href={c.slug}
                    className="text-sm text-ivory/65 transition-colors hover:text-gold"
                  >
                    {c.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-2">
            <p className="eyebrow mb-5">More</p>
            <ul className="space-y-3">
              {colB.map((c) => (
                <li key={c.id}>
                  <Link
                    href={c.slug}
                    className="text-sm text-ivory/65 transition-colors hover:text-gold"
                  >
                    {c.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-2">
            <p className="eyebrow mb-5">Service</p>
            <ul className="space-y-3 text-sm text-ivory/65">
              <li>
                <Link href={secondary.bespoke.href} className="hover:text-gold">
                  {secondary.bespoke.label}
                </Link>
              </li>
              <li>
                <Link href="/delivery" className="hover:text-gold">
                  Delivery
                </Link>
              </li>
              <li>
                <Link href="/size-guide" className="hover:text-gold">
                  Size guide
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-gold">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href={secondary.visit.href} className="hover:text-gold">
                  {secondary.visit.label}
                </Link>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-2">
            <p className="eyebrow mb-5">Talk to us</p>
            <ul className="space-y-3 text-sm text-ivory/65">
              <li>
                <a
                  href={getWhatsAppStylistUrl("Footer")}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-gold"
                >
                  {secondary.whatsapp.label}
                </a>
              </li>
              <li>
                <a href={`tel:+${BRAND.phoneE164}`} className="hover:text-gold">
                  {BRAND.phone}
                </a>
              </li>
              <li>
                <Link href={secondary.wishlist.href} className="hover:text-gold">
                  {secondary.wishlist.label}
                </Link>
              </li>
              <li>
                <Link href={secondary.bag.href} className="hover:text-gold">
                  {secondary.bag.label}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="gold-rule my-12" />
        <div className="flex flex-col gap-4 text-xs uppercase tracking-[0.15em] text-ivory/40 md:flex-row md:justify-between">
          <p>
            © {new Date().getFullYear()} {BRAND.fullName}
          </p>
          <p>{BRAND.hours}</p>
        </div>
      </div>
    </footer>
  );
}
