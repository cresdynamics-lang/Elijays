import type { Metadata } from "next";
import { CategoryShell } from "@/components/CategoryShell";
import { chipsFromCategory, productsForNavCategory } from "@/lib/categoryProducts";
import { getCategoryById } from "@/lib/navigation";
import { notFound } from "next/navigation";

const cat = getCategoryById("accessories");

export const metadata: Metadata = {
  title: cat?.page.metaTitle.replace(" | ELIJAYS Men's Wear", "") || "Accessories",
  description: cat?.page.intro,
};

export default async function AccessoriesPage() {
  if (!cat) notFound();
  return (
    <CategoryShell
      category={cat}
      products={await productsForNavCategory("accessories")}
      chips={chipsFromCategory("accessories")}
      filterLabels={["Colour", "Material", "Price"]}
    />
  );
}
