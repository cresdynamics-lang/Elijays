import type { Metadata } from "next";
import { CategoryShell } from "@/components/CategoryShell";
import { chipsFromCategory, productsForNavCategory } from "@/lib/categoryProducts";
import { getCategoryById } from "@/lib/navigation";
import { notFound } from "next/navigation";

const cat = getCategoryById("trousers");

export const metadata: Metadata = {
  title: cat?.page.metaTitle.replace(" | ELIJAYS Men's Wear", "") || "Trousers",
  description: cat?.page.intro,
};

export default async function TrousersPage() {
  if (!cat) notFound();
  return (
    <CategoryShell
      category={cat}
      products={await productsForNavCategory("trousers")}
      chips={chipsFromCategory("trousers")}
      filterLabels={["Waist", "Length", "Colour", "Fit", "Price"]}
    />
  );
}
