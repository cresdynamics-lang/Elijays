import type { Metadata } from "next";
import { CategoryShell } from "@/components/CategoryShell";
import { getCategoryById } from "@/lib/navigation";
import { getProductsByCategory, products } from "@/lib/products";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ sub: string }> };

const SUB_MAP: Record<
  string,
  { filter: () => ReturnType<typeof products.filter>; label?: string }
> = {
  belts: {
    filter: () => getProductsByCategory("belts"),
  },
  ties: {
    filter: () =>
      products.filter((p) => p.category === "ties" || p.category === "socks"),
  },
  socks: {
    filter: () => getProductsByCategory("socks"),
  },
  "gift-sets": {
    filter: () =>
      products.filter(
        (p) => p.subcategory === "gift-sets" || p.giftOptions === true
      ),
  },
  corporate: {
    filter: () =>
      products.filter(
        (p) => p.subcategory === "gift-sets" || p.giftOptions === true
      ),
  },
};

export async function generateStaticParams() {
  return Object.keys(SUB_MAP).map((sub) => ({ sub }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { sub } = await params;
  const cat = getCategoryById("accessories");
  const link = cat?.links.find((l) => l.href.endsWith(`/${sub}`));
  return {
    title: link?.label || "Accessories",
    description: link?.descriptor || cat?.page.intro,
  };
}

export default async function AccessoriesSubPage({ params }: Props) {
  const { sub } = await params;
  const cat = getCategoryById("accessories");
  const map = SUB_MAP[sub];
  if (!cat || !map) notFound();

  const link = cat.links.find((l) => l.href.endsWith(`/${sub}`));

  return (
    <CategoryShell
      category={{
        ...cat,
        page: {
          ...cat.page,
          h1: link?.label || cat.page.h1,
          subline: link?.descriptor || cat.page.subline,
        },
      }}
      products={map.filter()}
      chips={[
        { label: "All accessories", value: "all" },
        ...cat.links
          .filter((l) => l.href !== cat.slug)
          .map((l) => ({
            label: l.label,
            value: l.href.split("/").pop() || "all",
          })),
      ]}
      activeChip={sub}
    />
  );
}
