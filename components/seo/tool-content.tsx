import { ChevronDown } from "lucide-react";
import type { ToolMeta } from "@/lib/tools/types";

/** Server-rendered how-to + FAQ under each tool, for users and search engines. */
export function ToolContent({ tool }: { tool: ToolMeta }) {
  return (
    <div className="mt-20 grid gap-12 lg:grid-cols-[2fr_3fr]">
      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">How to use {tool.name}</h2>
        <ol className="space-y-3">
          {tool.seo.howTo.map((step, i) => (
            <li key={i} className="flex gap-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                {i + 1}
              </span>
              <span className="text-muted-foreground">{step}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">Frequently asked questions</h2>
        <div className="divide-y rounded-xl border">
          {tool.seo.faq.map((item) => (
            <details key={item.q} className="group px-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 font-medium [&::-webkit-details-marker]:hidden">
                {item.q}
                <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
              </summary>
              <p className="pb-4 text-sm leading-relaxed text-muted-foreground">{item.a}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
