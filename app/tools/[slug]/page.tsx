import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { ToolJsonLd } from "@/components/seo/json-ld";
import { ToolContent } from "@/components/seo/tool-content";
import { ToolHero } from "@/components/seo/tool-hero";
import { ToolMount } from "@/components/tools/tool-mount";
import { getTool, tools } from "@/lib/tools/registry";

export function generateStaticParams() {
  return tools.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: PageProps<"/tools/[slug]">): Promise<Metadata> {
  const tool = getTool((await params).slug);
  if (!tool) return {};
  return {
    title: tool.seo.title,
    description: tool.seo.description,
    keywords: tool.seo.keywords,
    alternates: { canonical: `/tools/${tool.slug}` },
    openGraph: { title: tool.seo.title, description: tool.seo.description, url: `/tools/${tool.slug}` },
  };
}

async function ToolPageContent({ params }: Pick<PageProps<"/tools/[slug]">, "params">) {
  const tool = getTool((await params).slug);
  if (!tool) notFound();

  return (
    <>
      <ToolHero tool={tool} />
      <ToolMount slug={tool.slug} />
      <ToolContent tool={tool} />
      <ToolJsonLd tool={tool} />
    </>
  );
}

export default function ToolPage(props: PageProps<"/tools/[slug]">) {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      {/* Params are read inside Suspense so the route keeps a static App Shell. */}
      <Suspense fallback={<Skeleton className="h-96 w-full rounded-xl" />}>
        <ToolPageContent params={props.params} />
      </Suspense>
    </main>
  );
}
