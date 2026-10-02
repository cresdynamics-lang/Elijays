import type { Product } from "@/lib/products";

export type ProductTag = "new" | "bestseller" | "bespoke";

const NEW_WINDOW_MS = 21 * 24 * 60 * 60 * 1000;

/** New tag: day 1 through day 21 from updatedAt. Bestseller drives the Sale page. */
export function getProductTags(
  product: Product,
  now = new Date()
): ProductTag[] {
  const tags: ProductTag[] = [];

  if (product.updatedAt) {
    const updated = new Date(product.updatedAt).getTime();
    const age = now.getTime() - updated;
    if (!Number.isNaN(updated) && age >= 0 && age <= NEW_WINDOW_MS) {
      tags.push("new");
    }
  }

  if (product.isBestseller) tags.push("bestseller");
  if (product.isBespoke) tags.push("bespoke");

  return tags;
}

export function tagLabel(tag: ProductTag): string {
  switch (tag) {
    case "new":
      return "New";
    case "bestseller":
      return "Bestseller";
    case "bespoke":
      return "Bespoke";
  }
}
