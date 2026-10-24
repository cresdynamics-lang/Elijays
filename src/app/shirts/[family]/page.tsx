import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CategoryShell } from "@/components/CategoryShell";
import { getCategoryById } from "@/lib/navigation";
import { shirtFamilies } from "@/lib/products";
import { getCatalog } from "@/lib/catalog/store";

type Props = { params: Promise<{ family: string }> };

export async function generateStaticParams() {
  return shirtFamilies.map((f) => ({ family: f.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { family } = await params;
  const shirts = getCategoryById("shirts");
  const link = shirts?.links.find((l) => l.href.endsWith(`/${family}`));
  return {
    title: link?.label || family,
    description: link?.descriptor || shirts?.page.intro,
  };
}

export default async function ShirtFamilyPage({ params }: Props) {
  const { family } = await params;
  const shirts = getCategoryById("shirts");
  const familyData = shirtFamilies.find((f) => f.slug === family);
  if (!shirts || !familyData) notFound();

  const link = shirts.links.find((l) => l.href.endsWith(`/${family}`));
  const { getProductsBySubcategory } = await getCatalog();
  let list = getProductsBySubcategory("shirts", familyData.subcategory);
  if (family === "printed") {
    list = [
      ...getProductsBySubcategory("shirts", "printed"),
      ...getProductsBySubcategory("shirts", "polo"),
    ];
  }

  return (
    <CategoryShell
      category={{
        ...shirts,
        page: {
          ...shirts.page,
          h1: link?.label || familyData.name,
          subline: link?.descriptor || familyData.subtitle,
        },
      }}
      products={list}
      chips={[
        { label: "All", value: "all" },
        ...shirts.links
          .filter((l) => l.href !== shirts.slug)
          .map((l) => ({
            label: l.label,
            value: l.href.split("/").pop() || "all",
          })),
      ]}
      activeChip={family}
      filterLabels={["Size", "Colour", "Fit", "Collar", "Price"]}
    />
  );
}
