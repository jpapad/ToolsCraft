import type { Metadata } from "next";
import { ToolCard } from "@/components/shared/tool-card";
import { categories } from "@/lib/tools/categories";
import { toolsInCategory } from "@/lib/tools/registry";

export const metadata: Metadata = {
  title: "All Tools",
  description: "Every PDF, image and developer tool on ToolsCraft. All free, all running privately in your browser.",
  alternates: { canonical: "/tools" },
};

export default function AllToolsPage() {
  return (
    <main className="mx-auto max-w-6xl space-y-14 px-4 py-12">
      <div className="space-y-1.5">
        <h1 className="text-3xl font-semibold tracking-tight">All tools</h1>
        <p className="text-muted-foreground">Free, private, and running entirely in your browser.</p>
      </div>
      {categories.map((cat) => {
        const { live, planned } = toolsInCategory(cat.id);
        return (
          <section key={cat.id} className="space-y-4">
            <h2 className="text-xl font-semibold tracking-tight">{cat.name}</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {live.map((t) => (
                <ToolCard key={t.slug} tool={t} />
              ))}
              {planned.map((t) => (
                <ToolCard key={t.slug} tool={t} soon />
              ))}
            </div>
          </section>
        );
      })}
    </main>
  );
}
