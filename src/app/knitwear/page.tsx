import type { Metadata } from "next";
import { CategoryShell } from "@/components/CategoryShell";
import { chipsFromCategory, productsForNavCategory } from "@/lib/categoryProducts";
import { getCategoryById } from "@/lib/navigation";
import { notFound } from "next/navigation";

const cat = getCategoryById("knitwear");

export const metadata: Metadata = {
  title: cat?.page.metaTitle.replace(" | ELIJAYS Men's Wear", "") || "Knitwear",
  description: cat?.page.intro,
};

export default function KnitwearPage() {
  if (!cat) notFound();
  return (
    <CategoryShell
      category={cat}
      products={productsForNavCategory("knitwear")}
      chips={chipsFromCategory("knitwear")}
      filterLabels={["Size", "Colour", "Yarn", "Neckline", "Price"]}
    />
  );
}
