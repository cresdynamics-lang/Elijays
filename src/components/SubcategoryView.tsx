import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CategoryShell } from "@/components/CategoryShell";
import { chipsFromCategory, productsForNavCategory } from "@/lib/categoryProducts";
import { getCategoryById, type NavCategory } from "@/lib/navigation";

type Props = {
  categoryId: string;
  sub: string;
};

export function subcategoryMetadata(
  categoryId: string,
  sub: string
): Metadata {
  const cat = getCategoryById(categoryId);
  if (!cat) return { title: "Category" };
  const link = cat.links.find((l) => l.href.endsWith(`/${sub}`));
  return {
    title: link
      ? `${link.label} | ${cat.page.metaTitle}`
      : cat.page.metaTitle,
    description: link?.descriptor || cat.page.intro,
  };
}

export function SubcategoryView({ categoryId, sub }: Props) {
  const cat = getCategoryById(categoryId);
  if (!cat) notFound();

  const link = cat.links.find((l) => l.href.endsWith(`/${sub}`));
  if (!link || link.href === cat.slug) notFound();

  const products = productsForNavCategory(categoryId).filter(
    (p) =>
      p.subcategory === sub ||
      p.subcategory.replace(/_/g, "-") === sub ||
      link.href.includes(p.subcategory)
  );

  const pageCat: NavCategory = {
    ...cat,
    page: {
      ...cat.page,
      h1: link.label,
      subline: link.descriptor,
      intro: `${link.descriptor} ${cat.page.intro}`,
    },
  };

  return (
    <CategoryShell
      category={pageCat}
      products={products.length ? products : productsForNavCategory(categoryId)}
      chips={chipsFromCategory(categoryId)}
      activeChip={sub}
    />
  );
}
