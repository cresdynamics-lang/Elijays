import type { MetadataRoute } from "next";
import { getEnabledCategories } from "@/lib/navigation";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://elijays.co.ke";
  const categories = getEnabledCategories();
  const entries: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/bespoke`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/visit`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/lookbook`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/the-house`, changeFrequency: "monthly", priority: 0.7 },
  ];

  for (const cat of categories) {
    entries.push({
      url: `${base}${cat.slug}`,
      changeFrequency: "weekly",
      priority: 0.9,
    });
    for (const link of cat.links) {
      if (link.href === cat.slug) continue;
      if (!link.href.startsWith("/")) continue;
      entries.push({
        url: `${base}${link.href}`,
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
  }

  return entries;
}
