import type { Metadata } from "next";
import { CategoryShell } from "@/components/CategoryShell";
import { getCategoryById } from "@/lib/navigation";
import { getCatalog } from "@/lib/catalog/store";
import type { Catalog, Product } from "@/lib/products";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ sub: string }> };

const SUB_MAP: Record<
  string,
  { filter: (catalog: Catalog) => Product[]; label?: string }
> = {
  belts: {
    filter: (c) => c.getProductsByCategory("belts"),
  },
  ties: {
    filter: (c) =>
      c.products.filter((p) => p.category === "ties" || p.category === "socks"),
  },
  socks: {
    filter: (c) => c.getProductsByCategory("socks"),
  },
  "gift-sets": {
    filter: (c) =>
      c.products.filter(
        (p) => p.subcategory === "gift-sets" || p.giftOptions === true
      ),
  },
  corporate: {
    filter: (c) =>
      c.products.filter(
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
      products={map.filter(await getCatalog())}
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
