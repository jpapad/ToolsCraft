import { getCategory } from "@/lib/tools/categories";
import { site } from "@/lib/site";
import type { ToolMeta } from "@/lib/tools/types";

export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // Escape "<" so content can never close the script tag.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

export function ToolJsonLd({ tool }: { tool: ToolMeta }) {
  const url = `${site.url}/tools/${tool.slug}`;
  const category = getCategory(tool.category);

  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "WebApplication",
            name: tool.name,
            url,
            description: tool.seo.description,
            applicationCategory: tool.category === "dev" ? "DeveloperApplication" : "UtilitiesApplication",
            operatingSystem: "Any (runs in the browser)",
            browserRequirements: "Requires JavaScript",
            isAccessibleForFree: true,
            offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
          },
          {
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: site.url },
              { "@type": "ListItem", position: 2, name: category?.name, item: `${site.url}/category/${tool.category}` },
              { "@type": "ListItem", position: 3, name: tool.name, item: url },
            ],
          },
          {
            "@type": "FAQPage",
            mainEntity: tool.seo.faq.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          },
        ],
      }}
    />
  );
}
