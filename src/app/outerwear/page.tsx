import type { Metadata } from "next";
import { CategoryShell } from "@/components/CategoryShell";
import { chipsFromCategory, productsForNavCategory } from "@/lib/categoryProducts";
import { getCategoryById } from "@/lib/navigation";
import { notFound } from "next/navigation";

const cat = getCategoryById("outerwear");

export const metadata: Metadata = {
  title: cat?.page.metaTitle.replace(" | ELIJAYS Men's Wear", "") || "Outerwear",
  description: cat?.page.intro,
};

export default function OuterwearPage() {
  if (!cat) notFound();
  return (
    <CategoryShell
      category={cat}
      products={productsForNavCategory("outerwear")}
      chips={chipsFromCategory("outerwear")}
      filterLabels={["Size", "Colour", "Material", "Season", "Price"]}
    />
  );
}
