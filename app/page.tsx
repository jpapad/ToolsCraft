import Link from "next/link";
import { ArrowRight, CloudOff, ShieldCheck, Zap } from "lucide-react";
import { ToolSearch } from "@/components/layout/tool-search";
import { ToolCard } from "@/components/shared/tool-card";
import { categories } from "@/lib/tools/categories";
import { toolsInCategory } from "@/lib/tools/registry";

const promises = [
  { icon: ShieldCheck, title: "Private by design", text: "Files are processed on your device. Nothing is uploaded." },
  { icon: Zap, title: "Fast", text: "No upload or download wait. WebAssembly does the heavy lifting." },
  { icon: CloudOff, title: "Works offline", text: "Once a tool has loaded, it keeps working without internet." },
];

export default function HomePage() {
  return (
    <main>
      <section className="relative overflow-hidden border-b">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,color-mix(in_oklch,var(--primary)_14%,transparent),transparent_60%)]"
        />
        <div className="relative mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-20 text-center sm:py-28">
          <span className="flex items-center gap-1.5 rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground shadow-xs">
            <ShieldCheck className="size-3.5 text-emerald-600 dark:text-emerald-400" />
            100% in-browser · no uploads · no sign-up
          </span>
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            Every file tool you need, <span className="text-primary">without giving up your files</span>
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground text-balance">
            Merge PDFs, compress images, format JSON and more. Everything runs right here in your browser.
          </p>
          <ToolSearch variant="hero" />
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-12 sm:grid-cols-3">
        {promises.map(({ icon: Icon, title, text }) => (
          <div key={title} className="flex gap-3">
            <Icon className="mt-0.5 size-5 shrink-0 text-primary" />
            <div>
              <p className="font-medium">{title}</p>
              <p className="text-sm text-muted-foreground">{text}</p>
            </div>
          </div>
        ))}
      </section>

      <div className="mx-auto max-w-6xl space-y-16 px-4">
        {categories.map((cat) => {
          const { live, planned } = toolsInCategory(cat.id);
          return (
            <section key={cat.id} id={cat.id} className="scroll-mt-20 space-y-5">
              <div className="flex items-end justify-between gap-4">
                <div className="space-y-1">
                  <h2 className="text-2xl font-semibold tracking-tight">{cat.name}</h2>
                  <p className="text-muted-foreground">{cat.description}</p>
                </div>
                <Link
                  href={`/category/${cat.id}`}
                  className="hidden shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline sm:flex"
                >
                  View all <ArrowRight className="size-4" />
                </Link>
              </div>
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
      </div>
    </main>
  );
}
