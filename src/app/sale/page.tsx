import Link from "next/link";
import { products, getBestsellers } from "@/lib/products";
import { ProductCard } from "@/components/ProductCard";
import { MetaBrowse } from "@/components/MetaEvents";

export const metadata = {
  title: "Sale · Bestsellers",
  description:
    "ELIJAYS bestsellers — the pieces men re-order. Suits, shirts and finishing details from Muindi Mbingu Street.",
};

export default function SalePage() {
  const bestsellers = getBestsellers();

  return (
    <div className="atmosphere min-h-screen pb-28 pt-28 md:pt-36">
      <MetaBrowse category="Sale · Bestsellers" />
      <div className="mx-auto max-w-[1600px] px-5 md:px-8 lg:px-12">
        <p className="eyebrow">Sale</p>
        <h1 className="display mt-3 text-4xl md:text-6xl">Bestsellers</h1>
        <p className="whisper mt-4 max-w-xl text-lg">
          What goes to sale is what sells — tagged bestsellers from the house.
        </p>
        <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
          {bestsellers.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
        {bestsellers.length === 0 ? (
          <p className="mt-12 text-ivory/50">
            Bestsellers will appear here. Browse{" "}
            <Link href="/suits" className="text-gold">
              suits
            </Link>
            .
          </p>
        ) : null}
        <p className="mt-10 text-sm text-ivory/40">
          {bestsellers.length} of {products.length} pieces tagged bestseller.
        </p>
      </div>
    </div>
  );
}
