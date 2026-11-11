import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { categories } from "@/lib/tools/categories";
import { tools } from "@/lib/tools/registry";
import { site } from "@/lib/site";
import { Logo } from "./logo";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t bg-muted/30">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-5">
        <div className="space-y-3 lg:col-span-2">
          <Logo />
          <p className="max-w-xs text-sm text-muted-foreground">{site.tagline}.</p>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="size-3.5 text-emerald-600 dark:text-emerald-400" />
            No uploads, no accounts, no tracking of your files.
          </p>
        </div>

        {categories.map((c) => (
          <div key={c.id} className="space-y-3">
            <Link href={`/category/${c.id}`} className="text-sm font-medium hover:underline">
              {c.name}
            </Link>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {tools
                .filter((t) => t.category === c.id)
                .map((t) => (
                  <li key={t.slug}>
                    <Link href={`/tools/${t.slug}`} className="hover:text-foreground">
                      {t.name}
                    </Link>
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-4 text-xs text-muted-foreground">
          <span>© {site.name}</span>
          <Link href="/privacy" className="hover:text-foreground">
            Privacy
          </Link>
        </div>
      </div>
    </footer>
  );
}
