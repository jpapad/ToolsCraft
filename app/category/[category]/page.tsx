import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { ToolCard } from "@/components/shared/tool-card";
import { categories, getCategory } from "@/lib/tools/categories";
import { toolsInCategory } from "@/lib/tools/registry";
import { cn } from "@/lib/utils";

export function generateStaticParams() {
  return categories.map((c) => ({ category: c.id }));
}

export async function generateMetadata({ params }: PageProps<"/category/[category]">): Promise<Metadata> {
  const cat = getCategory((await params).category);
  if (!cat) return {};
  return {
    title: `Free Online ${cat.name}`,
    description: cat.description,
    alternates: { canonical: `/category/${cat.id}` },
  };
}

async function CategoryContent({ params }: Pick<PageProps<"/category/[category]">, "params">) {
  const cat = getCategory((await params).category);
  if (!cat) notFound();
  const { live, planned } = toolsInCategory(cat.id);
  const Icon = cat.icon;

  return (
    <>
      <div className="flex items-start gap-4 pb-10">
        <div className={cn("flex size-12 shrink-0 items-center justify-center rounded-xl", cat.tone)}>
          <Icon className="size-6" />
        </div>
        <div className="space-y-1.5">
          <h1 className="text-3xl font-semibold tracking-tight">{cat.name}</h1>
          <p className="max-w-2xl text-muted-foreground">{cat.description}</p>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {live.map((t) => (
          <ToolCard key={t.slug} tool={t} />
        ))}
        {planned.map((t) => (
          <ToolCard key={t.slug} tool={t} soon />
        ))}
      </div>
    </>
  );
}

export default function CategoryPage(props: PageProps<"/category/[category]">) {
  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <Suspense fallback={<Skeleton className="h-64 w-full rounded-xl" />}>
        <CategoryContent params={props.params} />
      </Suspense>
    </main>
  );
}
