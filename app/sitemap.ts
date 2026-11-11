import type { MetadataRoute } from "next";
import { categories } from "@/lib/tools/categories";
import { tools } from "@/lib/tools/registry";
import { site } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: site.url, changeFrequency: "weekly", priority: 1 },
    { url: `${site.url}/tools`, changeFrequency: "weekly", priority: 0.8 },
    ...categories.map((c) => ({
      url: `${site.url}/category/${c.id}`,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...tools.map((t) => ({
      url: `${site.url}/tools/${t.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.9,
    })),
    { url: `${site.url}/privacy`, changeFrequency: "yearly", priority: 0.3 },
  ];
}
