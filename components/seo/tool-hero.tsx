import Link from "next/link";
import { ChevronRight, Infinity as InfinityIcon, ShieldCheck, UserX } from "lucide-react";
import { getCategory } from "@/lib/tools/categories";
import type { ToolMeta } from "@/lib/tools/types";
import { cn } from "@/lib/utils";

export function ToolHero({ tool }: { tool: ToolMeta }) {
  const category = getCategory(tool.category);
  const Icon = tool.icon;

  return (
    <div className="space-y-5 pb-8">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          Home
        </Link>
        <ChevronRight className="size-3.5" />
        <Link href={`/category/${tool.category}`} className="hover:text-foreground">
          {category?.name}
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="text-foreground" aria-current="page">
          {tool.name}
        </span>
      </nav>

      <div className="flex items-start gap-4">
        <div className={cn("flex size-12 shrink-0 items-center justify-center rounded-xl", category?.tone)}>
          <Icon className="size-6" />
        </div>
        <div className="space-y-1.5">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{tool.name}</h1>
          <p className="max-w-2xl text-muted-foreground">{tool.seo.description}</p>
        </div>
      </div>

      <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
        <li className="flex items-center gap-1.5">
          <ShieldCheck className="size-4 text-emerald-600 dark:text-emerald-400" />
          {tool.runtime === "client" ? "Runs in your browser" : "Files deleted after 1 hour"}
        </li>
        <li className="flex items-center gap-1.5">
          <UserX className="size-4" /> No sign-up
        </li>
        <li className="flex items-center gap-1.5">
          <InfinityIcon className="size-4" /> Free, no limits
        </li>
      </ul>
    </div>
  );
}
