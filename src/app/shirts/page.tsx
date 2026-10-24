import type { Metadata } from "next";
import { CategoryShell } from "@/components/CategoryShell";
import { chipsFromCategory, productsForNavCategory } from "@/lib/categoryProducts";
import { getCategoryById } from "@/lib/navigation";
import { notFound } from "next/navigation";

const cat = getCategoryById("shirts");

export const metadata: Metadata = {
  title: cat?.page.metaTitle.replace(" | ELIJAYS Men's Wear", "") || "Shirts",
  description: cat?.page.intro,
};

export default async function ShirtsPage() {
  if (!cat) notFound();
  return (
    <CategoryShell
      category={cat}
      products={await productsForNavCategory("shirts")}
      chips={chipsFromCategory("shirts")}
      filterLabels={["Size", "Colour", "Fit", "Collar", "Price"]}
    />
  );
}
