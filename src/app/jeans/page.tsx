import type { Metadata } from "next";
import { CategoryShell } from "@/components/CategoryShell";
import { chipsFromCategory, productsForNavCategory } from "@/lib/categoryProducts";
import { getCategoryById } from "@/lib/navigation";
import { notFound } from "next/navigation";

const cat = getCategoryById("jeans");

export const metadata: Metadata = {
  title: cat?.page.metaTitle.replace(" | ELIJAYS Men's Wear", "") || "Jeans",
  description: cat?.page.intro,
};

export default async function JeansPage() {
  if (!cat) notFound();
  return (
    <CategoryShell
      category={cat}
      products={await productsForNavCategory("jeans")}
      chips={chipsFromCategory("jeans")}
      filterLabels={["Waist", "Length", "Wash", "Fit", "Price"]}
    />
  );
}
