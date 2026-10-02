import { getCategoryById } from "@/lib/navigation";
import {
  getProductsByCategory,
  products,
  type Product,
} from "@/lib/products";

/** Map nav category ids to catalogue products */
export function productsForNavCategory(id: string): Product[] {
  switch (id) {
    case "suits":
      return getProductsByCategory("suits");
    case "shirts":
      return getProductsByCategory("shirts").filter((p) => p.subcategory !== "polo");
    case "polos":
      return getProductsByCategory("shirts").filter((p) => p.subcategory === "polo");
    case "trousers":
      return getProductsByCategory("trousers").filter(
        (p) => p.subcategory !== "chinos" && p.subcategory !== "khakis"
      );
    case "khakis":
      return getProductsByCategory("trousers").filter(
        (p) =>
          p.subcategory === "chinos" ||
          p.subcategory === "khakis" ||
          /chino|khaki/i.test(p.name)
      );
    case "jeans":
      return getProductsByCategory("jeans");
    case "outerwear":
      return getProductsByCategory("jackets");
    case "knitwear":
      return getProductsByCategory("sweaters");
    case "accessories":
      return products.filter((p) =>
        ["belts", "ties", "socks"].includes(p.category)
      );
    default:
      return [];
  }
}

export function chipsFromCategory(id: string) {
  const cat = getCategoryById(id);
  if (!cat) return [{ label: "All", value: "all" }];

  const chips = [{ label: "All", value: "all" }];
  for (const link of cat.links) {
    if (link.href === cat.slug) continue;
    const parts = link.href.split("/").filter(Boolean);
    const value = parts[parts.length - 1] || "all";
    if (chips.some((c) => c.value === value)) continue;
    chips.push({ label: link.label, value });
  }
  return chips;
}
