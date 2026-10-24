import type { Metadata } from "next";
import { CategoryShell } from "@/components/CategoryShell";
import { chipsFromCategory, productsForNavCategory } from "@/lib/categoryProducts";
import { getCategoryById } from "@/lib/navigation";
import { notFound } from "next/navigation";

const cat = getCategoryById("khakis");

export const metadata: Metadata = {
  title: cat?.page.metaTitle.replace(" | ELIJAYS Men's Wear", "") || "Khakis",
  description: cat?.page.intro,
};

export default async function KhakisPage() {
  if (!cat) notFound();
  return (
    <CategoryShell
      category={cat}
      products={await productsForNavCategory("khakis")}
      chips={chipsFromCategory("khakis")}
      filterLabels={["Waist", "Length", "Colour", "Fit", "Price"]}
    />
  );
}
