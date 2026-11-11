import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getCategory } from "@/lib/tools/categories";
import type { ToolSummary } from "@/lib/tools/types";
import { cn } from "@/lib/utils";

export function ToolCard({ tool, soon }: { tool: ToolSummary; soon?: boolean }) {
  const Icon = tool.icon;
  const tone = getCategory(tool.category)?.tone;

  const body = (
    <>
      <div className="flex items-start justify-between">
        <div className={cn("flex size-10 items-center justify-center rounded-lg", tone)}>
          <Icon className="size-5" />
        </div>
        {soon ? (
          <Badge variant="secondary">Soon</Badge>
        ) : (
          <ArrowUpRight className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
        )}
      </div>
      <div className="space-y-1">
        <h3 className="font-medium">{tool.name}</h3>
        <p className="text-sm text-muted-foreground">{tool.tagline}</p>
      </div>
    </>
  );

  const base = "group flex h-full flex-col gap-4 rounded-xl border bg-card p-5";

  if (soon) {
    return (
      <div className={cn(base, "opacity-60")} aria-disabled>
        {body}
      </div>
    );
  }

  return (
    <Link
      href={`/tools/${tool.slug}`}
      className={cn(
        base,
        "shadow-xs transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
      )}
    >
      {body}
    </Link>
  );
}
