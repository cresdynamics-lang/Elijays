import type { Metadata } from "next";
import { CategoryShell } from "@/components/CategoryShell";
import { chipsFromCategory, productsForNavCategory } from "@/lib/categoryProducts";
import { getCategoryById } from "@/lib/navigation";
import { notFound } from "next/navigation";

const cat = getCategoryById("suits");

export const metadata: Metadata = {
  title: cat?.page.metaTitle.replace(" | ELIJAYS Men's Wear", "") || "Suits",
  description: cat?.page.intro,
};

export default function SuitsPage() {
  if (!cat) notFound();
  return (
    <CategoryShell
      category={cat}
      products={productsForNavCategory("suits")}
      chips={chipsFromCategory("suits")}
      filterLabels={["Size", "Colour", "Fabric", "Fit", "Occasion", "Price"]}
      bespokeCard
    />
  );
}
